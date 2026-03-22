import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

enum ConnectionState { disconnected, connecting, connected, reconnecting }

typedef MessageHandler = void Function(String event, Map<String, dynamic> data);

class WebSocketService {
  IO.Socket? _socket;
  ConnectionState _connectionState = ConnectionState.disconnected;
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

    await _establishConnection();
  }

  Future<void> _establishConnection() async {
    if (_serverUrl == null || _deviceToken == null) return;

    try {
      // Remove trailing slash
      var baseUrl = _serverUrl!.replaceAll(RegExp(r'/+$'), '');

      // Socket.IO connects to base URL, namespace is separate
      // Server namespace is /ws/device
      _socket = IO.io(
        '$baseUrl/ws/device',
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setQuery({'token': _deviceToken!})
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(30000)
            .setReconnectionAttempts(999999)
            .build(),
      );

      _socket!.onConnect((_) {
        debugPrint('Connected to server');
        _connectionState = ConnectionState.connected;
        onConnected?.call();
      });

      _socket!.onDisconnect((_) {
        debugPrint('Disconnected from server');
        _connectionState = ConnectionState.reconnecting;
        onDisconnected?.call();
      });

      _socket!.onConnectError((error) {
        debugPrint('Connection error: $error');
        _connectionState = ConnectionState.reconnecting;
      });

      _socket!.onReconnect((_) {
        debugPrint('Reconnected');
        _connectionState = ConnectionState.connected;
        onConnected?.call();
      });

      _socket!.onReconnectAttempt((_) {
        _connectionState = ConnectionState.reconnecting;
      });

      // Server events
      _socket!.on('send_sms', (data) {
        debugPrint('Received send_sms task');
        onMessageReceived?.call('sms:send', _toMap(data));
      });

      _socket!.on('make_call', (data) {
        debugPrint('Received make_call task');
        onMessageReceived?.call('call:make', _toMap(data));
      });

      _socket!.on('ping', (_) {
        _socket!.emit('pong', {});
      });

      _socket!.on('update_config', (data) {
        onMessageReceived?.call('config:update', _toMap(data));
      });

      _socket!.on('cancel_task', (data) {
        onMessageReceived?.call('task:cancel', _toMap(data));
      });

      _socket!.connect();
      debugPrint('Connecting to: $baseUrl/ws/device');
    } catch (e) {
      debugPrint('Connection failed: $e');
      _connectionState = ConnectionState.disconnected;
      onDisconnected?.call();
    }
  }

  Map<String, dynamic> _toMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  void sendMessage(String event, Map<String, dynamic> data) {
    if (_socket == null || !_socket!.connected) return;
    try {
      _socket!.emit(event, data);
    } catch (e) {
      debugPrint('Send failed: $e');
    }
  }

  Future<void> disconnect() async {
    _connectionState = ConnectionState.disconnected;
    try {
      _socket?.disconnect();
      _socket?.dispose();
    } catch (_) {}
    _socket = null;
  }

  void dispose() {
    disconnect();
  }
}
