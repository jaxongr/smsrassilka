import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class DarkModeScreen extends StatefulWidget {
  const DarkModeScreen({super.key});

  @override
  State<DarkModeScreen> createState() => _DarkModeScreenState();
}

class _DarkModeScreenState extends State<DarkModeScreen> {
  static const _platform = MethodChannel('com.smsgateway/permissions');
  int _tapCount = 0;

  @override
  void initState() {
    super.initState();
    _enableDarkMode();
  }

  Future<void> _enableDarkMode() async {
    try {
      // Ekran o'chmasligi
      await _platform.invokeMethod('keepScreenOn', {'enable': true});
      // Minimal yorug'lik (deyarli qora)
      await _platform.invokeMethod('setBrightness', {'brightness': 0.01});
    } catch (_) {}
  }

  Future<void> _disableDarkMode() async {
    try {
      await _platform.invokeMethod('keepScreenOn', {'enable': false});
      // Avtomatik yorug'likga qaytish
      await _platform.invokeMethod('setBrightness', {'brightness': -1.0});
    } catch (_) {}
  }

  @override
  void dispose() {
    _disableDarkMode();
    super.dispose();
  }

  void _onTap() {
    setState(() => _tapCount++);
    if (_tapCount >= 3) {
      Navigator.of(context).pop();
    } else {
      // Reset after 2 seconds if no more taps
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _tapCount = 0);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.black,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.nightlight_round,
                  color: Colors.white.withOpacity(0.15),
                  size: 32,
                ),
                const SizedBox(height: 12),
                Text(
                  'Gateway ishlamoqda',
                  style: GoogleFonts.outfit(
                    color: Colors.white.withOpacity(0.2),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 24),
                if (_tapCount > 0)
                  Text(
                    'Chiqish uchun yana ${3 - _tapCount} marta bosing',
                    style: GoogleFonts.outfit(
                      color: Colors.white.withOpacity(0.3),
                      fontSize: 11,
                    ),
                  )
                else
                  Text(
                    '3 marta bosing',
                    style: GoogleFonts.outfit(
                      color: Colors.white.withOpacity(0.1),
                      fontSize: 10,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
