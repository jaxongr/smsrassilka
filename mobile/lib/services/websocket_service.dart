import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config/constants.dart';

enum ConnectionState { disconnected, connecting, connected, reconnecting }

typedef MessageHandler = void Function(String event, Map<String, dynamic> data);

class WebSocketService {
  WebSocketChannel? _channel;
  ConnectionState _connectionState = ConnectionState.disconnected;
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempt = 0;
  String? _serverUrl;
  String? _deviceToken;
  MessageHandler? onMessageReceived;
  VoidCallback? onConnected;
  VoidCallback? onDisconnected;

  ConnectionState get connectionState => _connectionState;
  bool get isConnected => _connectionState == ConnectionState.connected;

  Future<void> connect(String serverUrl, String deviceToken) async {
    _serverUrl = serverUrl;
    _deviceToken = deviceToken;
    _connectionState = ConnectionState.connecting;
    _reconnectAttempt = 0;

    await _establishConnection();
  }

  Future<void> _establishConnection() async {
    if (_serverUrl == null || _deviceToken == null) return;

    try {
      final wsUrl = _serverUrl!
          .replaceFirst('https://', 'wss://')
          .replaceFirst('http://', 'ws://');
      final uri = Uri.parse('$wsUrl/ws/device?token=$_deviceToken');

      _channel = WebSocketChannel.connect(uri);

      await _channel!.ready;

      _connectionState = ConnectionState.connected;
      _reconnectAttempt = 0;
      onConnected?.call();

      _startPing();

      _channel!.stream.listen(
        _handleMessage,
        onError: (error) {
          debugPrint('WebSocket error: $error');
          _handleDisconnect();
        },
        onDone: () {
          debugPrint('WebSocket connection closed');
          _handleDisconnect();
        },
        cancelOnError: false,
      );
    } catch (e) {
      debugPrint('WebSocket connection failed: $e');
      _handleDisconnect();
    }
  }

  void _handleMessage(dynamic rawMessage) {
    try {
      final data = jsonDecode(rawMessage as String) as Map<String, dynamic>;
      final event = data['event'] as String? ?? 'unknown';
      final payload = data['data'] as Map<String, dynamic>? ?? {};

      if (event == 'pong') return;

      onMessageReceived?.call(event, payload);
    } catch (e) {
      debugPrint('Failed to parse WebSocket message: $e');
    }
  }

  void _handleDisconnect() {
    _connectionState = ConnectionState.reconnecting;
    _stopPing();
    onDisconnected?.call();
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_serverUrl == null || _deviceToken == null) return;

    _reconnectTimer?.cancel();

    final delay = _calculateReconnectDelay();
    debugPrint('Reconnecting in ${delay}ms (attempt $_reconnectAttempt)');

    _reconnectTimer = Timer(Duration(milliseconds: delay), () {
      _reconnectAttempt++;
      _connectionState = ConnectionState.reconnecting;
      _establishConnection();
    });
  }

  int _calculateReconnectDelay() {
    final baseDelay = AppConstants.wsReconnectBaseDelay;
    final maxDelay = AppConstants.wsReconnectMaxDelay;
    final delay = baseDelay * (1 << _reconnectAttempt);
    return delay > maxDelay ? maxDelay : delay;
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(
      const Duration(seconds: AppConstants.wsPingInterval),
      (_) {
        sendMessage('ping', {});
      },
    );
  }

  void _stopPing() {
    _pingTimer?.cancel();
    _pingTimer = null;
  }

  void sendMessage(String event, Map<String, dynamic> data) {
    if (_channel == null || !isConnected) return;

    try {
      final message = jsonEncode({
        'event': event,
        'data': data,
      });
      _channel!.sink.add(message);
    } catch (e) {
      debugPrint('Failed to send WebSocket message: $e');
    }
  }

  Future<void> disconnect() async {
    _serverUrl = null;
    _deviceToken = null;
    _connectionState = ConnectionState.disconnected;
    _reconnectTimer?.cancel();
    _stopPing();

    try {
      await _channel?.sink.close();
    } catch (_) {}
    _channel = null;
  }

  void dispose() {
    disconnect();
  }
}
