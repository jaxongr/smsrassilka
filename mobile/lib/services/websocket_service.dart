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
      final baseUrl = _serverUrl!.replaceAll(RegExp(r'/+$'), '');

      _socket = IO.io(
        '$baseUrl/ws/device',
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setQuery({'token': _deviceToken!})
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(30000)
            .build(),
      );

      _socket!.onConnect((_) {
        debugPrint('Socket.IO connected');
        _connectionState = ConnectionState.connected;
        onConnected?.call();
      });

      _socket!.onDisconnect((_) {
        debugPrint('Socket.IO disconnected');
        _connectionState = ConnectionState.reconnecting;
        onDisconnected?.call();
      });

      _socket!.onConnectError((error) {
        debugPrint('Socket.IO connect error: $error');
        _connectionState = ConnectionState.reconnecting;
        onDisconnected?.call();
      });

      _socket!.onError((error) {
        debugPrint('Socket.IO error: $error');
      });

      // Listen for server events
      _socket!.on('send_sms', (data) {
        onMessageReceived?.call('sms:send', Map<String, dynamic>.from(data));
      });

      _socket!.on('make_call', (data) {
        onMessageReceived?.call('call:make', Map<String, dynamic>.from(data));
      });

      _socket!.on('ping', (_) {
        _socket!.emit('pong', {});
      });

      _socket!.on('update_config', (data) {
        onMessageReceived?.call('config:update', Map<String, dynamic>.from(data));
      });

      _socket!.on('cancel_task', (data) {
        onMessageReceived?.call('task:cancel', Map<String, dynamic>.from(data));
      });

      _socket!.connect();
    } catch (e) {
      debugPrint('Socket.IO connection failed: $e');
      _connectionState = ConnectionState.disconnected;
      onDisconnected?.call();
    }
  }

  void sendMessage(String event, Map<String, dynamic> data) {
    if (_socket == null || !_socket!.connected) return;

    try {
      _socket!.emit(event, data);
    } catch (e) {
      debugPrint('Failed to send message: $e');
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
