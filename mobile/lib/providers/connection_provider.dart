import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sms_task.dart';
import '../models/call_task.dart';
import '../models/task_result.dart';
import '../services/websocket_service.dart';
import '../services/sms_service.dart';
import '../services/call_service.dart';
import '../services/audio_service.dart';
import '../services/battery_service.dart';
import '../platform/sim_method_channel.dart';
import 'settings_provider.dart';
import 'stats_provider.dart';
import 'task_queue_provider.dart';

class ConnectionNotifier extends StateNotifier<ConnectionState> {
  final Ref ref;
  final WebSocketService _wsService = WebSocketService();
  final SmsService _smsService = SmsService();
  final CallService _callService = CallService();
  final AudioService _audioService = AudioService();
  final BatteryService _batteryService = BatteryService();
  final SimMethodChannel _simChannel = SimMethodChannel();
  Timer? _statusTimer;
  bool _gatewayActive = false;

  ConnectionNotifier(this.ref) : super(ConnectionState.disconnected) {
    _wsService.onConnected = _onConnected;
    _wsService.onDisconnected = _onDisconnected;
    _wsService.onMessageReceived = _onMessage;
  }

  bool get isGatewayActive => _gatewayActive;

  Future<void> connect() async {
    final settings = ref.read(settingsProvider);
    if (settings.serverUrl.isEmpty || settings.deviceToken.isEmpty) return;

    state = ConnectionState.connecting;
    await _wsService.connect(settings.serverUrl, settings.deviceToken);
  }

  Future<void> disconnect() async {
    _gatewayActive = false;
    _statusTimer?.cancel();
    await _wsService.disconnect();
    state = ConnectionState.disconnected;
  }

  void toggleGateway() {
    _gatewayActive = !_gatewayActive;
    if (_gatewayActive) {
      _wsService.sendMessage('gateway:start', {});
      _startStatusReporting();
    } else {
      _wsService.sendMessage('gateway:stop', {});
      _statusTimer?.cancel();
    }
  }

  void _onConnected() {
    state = ConnectionState.connected;
    _sendDeviceInfo();
  }

  void _onDisconnected() {
    state = ConnectionState.reconnecting;
  }

  void _onMessage(String event, Map<String, dynamic> data) {
    switch (event) {
      case 'sms:send':
        _handleSmsTask(data);
        break;
      case 'call:make':
        _handleCallTask(data);
        break;
      case 'device:status':
        _sendDeviceInfo();
        break;
      default:
        debugPrint('Unknown event: $event');
    }
  }

  Future<void> _handleSmsTask(Map<String, dynamic> data) async {
    final task = SmsTask.fromJson(data);
    final queueNotifier = ref.read(taskQueueProvider.notifier);
    queueNotifier.addTask(TaskQueueItem(
      taskId: task.taskId,
      type: TaskType.sms,
      phoneNumber: task.phoneNumber,
      status: TaskItemStatus.processing,
      timestamp: DateTime.now(),
    ));

    final result = await _smsService.sendSms(task);
    _wsService.sendMessage('task_result', result.toJson());

    final statsNotifier = ref.read(statsProvider.notifier);
    if (result.status == TaskStatus.success) {
      statsNotifier.incrementSmsSent();
      queueNotifier.updateTaskStatus(task.taskId, TaskItemStatus.success);
    } else {
      statsNotifier.incrementFailed();
      queueNotifier.updateTaskStatus(task.taskId, TaskItemStatus.failed,
          error: result.errorMessage);
    }
  }

  Future<void> _handleCallTask(Map<String, dynamic> data) async {
    final task = CallTask.fromJson(data);
    final queueNotifier = ref.read(taskQueueProvider.notifier);
    queueNotifier.addTask(TaskQueueItem(
      taskId: task.taskId,
      type: TaskType.call,
      phoneNumber: task.phoneNumber,
      status: TaskItemStatus.processing,
      timestamp: DateTime.now(),
    ));

    // Download voice file if provided
    if (task.voiceFileUrl != null && task.voiceFileUrl!.isNotEmpty) {
      try {
        await _audioService.downloadAndCache(task.voiceFileUrl!, task.taskId);
      } catch (e) {
        debugPrint('Failed to download voice file: $e');
      }
    }

    final result = await _callService.makeCall(task);
    _wsService.sendMessage('task_result', result.toJson());

    final statsNotifier = ref.read(statsProvider.notifier);
    if (result.status == TaskStatus.success) {
      statsNotifier.incrementCallsMade();
      queueNotifier.updateTaskStatus(task.taskId, TaskItemStatus.success);
    } else {
      statsNotifier.incrementFailed();
      queueNotifier.updateTaskStatus(task.taskId, TaskItemStatus.failed,
          error: result.errorMessage);
    }
  }

  Future<void> _sendDeviceInfo() async {
    try {
      final battery = await _batteryService.getBatteryLevel();
      final charging = await _batteryService.isCharging();

      // Send device status
      _wsService.sendMessage('device_status', {
        'batteryLevel': battery,
        'isCharging': charging,
        'networkType': 'wifi',
        'signalStrength': 4,
      });

      // Send SIM info
      try {
        final sims = await _simChannel.getSimCards();
        for (final sim in sims) {
          _wsService.sendMessage('sim_status', sim.toJson());
        }
      } catch (e) {
        // SIM read failed - send default SIM info so server knows we have a SIM
        debugPrint('SIM read failed: $e, sending default');
        _wsService.sendMessage('sim_status', {
          'slotIndex': 0,
          'operatorName': 'SIM 1',
          'phoneNumber': '',
          'smsCapable': true,
          'callCapable': true,
        });
      }
    } catch (e) {
      debugPrint('Failed to send device info: $e');
    }
  }

  void _startStatusReporting() {
    _statusTimer?.cancel();
    _statusTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (state == ConnectionState.connected) {
        _sendDeviceInfo();
      }
    });
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _wsService.dispose();
    super.dispose();
  }
}

final connectionProvider =
    StateNotifierProvider<ConnectionNotifier, ConnectionState>((ref) {
  return ConnectionNotifier(ref);
});
