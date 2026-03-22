import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/websocket_service.dart' as ws;

class ConnectionIndicator extends StatefulWidget {
  final ws.ConnectionState connectionState;
  final double size;

  const ConnectionIndicator({
    super.key,
    required this.connectionState,
    this.size = 10,
  });

  @override
  State<ConnectionIndicator> createState() => _ConnectionIndicatorState();
}

class _ConnectionIndicatorState extends State<ConnectionIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.connectionState == ws.ConnectionState.reconnecting ||
        widget.connectionState == ws.ConnectionState.connecting) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(ConnectionIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.connectionState == ws.ConnectionState.reconnecting ||
        widget.connectionState == ws.ConnectionState.connecting) {
      if (!_controller.isAnimating) {
        _controller.repeat(reverse: true);
      }
    } else {
      _controller.stop();
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _color {
    switch (widget.connectionState) {
      case ws.ConnectionState.connected:
        return AppTheme.successColor;
      case ws.ConnectionState.connecting:
      case ws.ConnectionState.reconnecting:
        return AppTheme.warningColor;
      case ws.ConnectionState.disconnected:
        return AppTheme.errorColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _color.withOpacity(_animation.value),
            boxShadow: [
              BoxShadow(
                color: _color.withOpacity(0.3),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
        );
      },
    );
  }
}
