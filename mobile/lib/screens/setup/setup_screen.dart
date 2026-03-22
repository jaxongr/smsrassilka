import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/theme.dart';
import '../../providers/settings_provider.dart';
import '../../providers/connection_provider.dart';
import '../../services/permission_service.dart';
import '../main_screen.dart';

class SetupScreen extends ConsumerStatefulWidget {
  const SetupScreen({super.key});

  @override
  ConsumerState<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends ConsumerState<SetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _serverUrlController = TextEditingController();
  final _tokenController = TextEditingController();
  final _permissionService = PermissionService();
  bool _isLoading = false;
  bool _isScanning = false;
  String? _error;

  @override
  void dispose() {
    _serverUrlController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() { _isLoading = true; _error = null; });

    try {
      await ref.read(settingsProvider.notifier).save(
        serverUrl: _serverUrlController.text.trim(),
        deviceToken: _tokenController.text.trim(),
      );
      await _permissionService.requestAllPermissions();
      await ref.read(connectionProvider.notifier).connect();

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MainScreen()),
        );
      }
    } catch (e) {
      setState(() { _error = 'Ulanishda xatolik: $e'; });
    } finally {
      if (mounted) setState(() { _isLoading = false; });
    }
  }

  void _onQrDetected(BarcodeCapture capture) {
    if (capture.barcodes.isEmpty) return;
    final code = capture.barcodes.first.rawValue;
    if (code == null) return;

    try {
      final data = jsonDecode(code);
      final server = data['server'] as String?;
      final token = data['token'] as String?;

      if (server != null && token != null) {
        setState(() {
          _serverUrlController.text = server;
          _tokenController.text = token;
          _isScanning = false;
        });
        // Avtomatik ulanish
        Future.delayed(const Duration(milliseconds: 300), _connect);
      }
    } catch (_) {
      setState(() { _error = 'QR kod noto\'g\'ri formatda'; _isScanning = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isScanning) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => setState(() => _isScanning = false),
          ),
          title: Text('QR kodni skanerlang',
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 18)),
          centerTitle: true,
        ),
        body: Stack(
          children: [
            MobileScanner(onDetect: _onQrDetected),
            Center(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.primary, width: 3),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            Positioned(
              bottom: 80,
              left: 0,
              right: 0,
              child: Text(
                'Dashboarddagi QR kodni ko\'rsating',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(color: Colors.white70, fontSize: 16),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppTheme.spacingL),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      gradient: AppTheme.walletGradient,
                      borderRadius: BorderRadius.circular(AppTheme.radiusXLarge),
                    ),
                    child: const Icon(Icons.sms_outlined, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: AppTheme.spacingL),

                  Text('SMS Gateway',
                    style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                  const SizedBox(height: AppTheme.spacingS),
                  Text('Qurilmangizni ulash uchun QR kodni skanerlang',
                    style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.textSecondary),
                    textAlign: TextAlign.center),
                  const SizedBox(height: AppTheme.spacingXL),

                  // QR skan tugmasi - ASOSIY
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () => setState(() => _isScanning = true),
                      icon: const Icon(Icons.qr_code_scanner, size: 28),
                      label: Text('QR kod skanerlash',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: AppTheme.spacingL),

                  // Yoki qo'lda kiritish
                  Row(children: [
                    const Expanded(child: Divider(color: AppTheme.cardBorder)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('yoki qo\'lda kiriting',
                        style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textHint)),
                    ),
                    const Expanded(child: Divider(color: AppTheme.cardBorder)),
                  ]),

                  const SizedBox(height: AppTheme.spacingM),

                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.cardBg,
                      borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    padding: const EdgeInsets.all(AppTheme.spacingL),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Server manzili',
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textSecondary)),
                        const SizedBox(height: AppTheme.spacingS),
                        TextFormField(
                          controller: _serverUrlController,
                          keyboardType: TextInputType.url,
                          decoration: const InputDecoration(
                            hintText: 'http://185.207.251.184:8086',
                            prefixIcon: Icon(Icons.link, color: AppTheme.textHint, size: 20),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) return 'Server manzilini kiriting';
                            if (!value.startsWith('http://') && !value.startsWith('https://')) return 'http:// bilan boshlang';
                            return null;
                          },
                        ),
                        const SizedBox(height: AppTheme.spacingM),
                        Text('Qurilma tokeni',
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textSecondary)),
                        const SizedBox(height: AppTheme.spacingS),
                        TextFormField(
                          controller: _tokenController,
                          decoration: const InputDecoration(
                            hintText: 'Dashboarddan oling',
                            prefixIcon: Icon(Icons.key, color: AppTheme.textHint, size: 20),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) return 'Tokenni kiriting';
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: AppTheme.spacingM),
                    Container(
                      padding: const EdgeInsets.all(AppTheme.spacingM),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                      ),
                      child: Row(children: [
                        const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 20),
                        const SizedBox(width: AppTheme.spacingS),
                        Expanded(child: Text(_error!,
                          style: GoogleFonts.outfit(fontSize: 13, color: AppTheme.errorColor))),
                      ]),
                    ),
                  ],

                  const SizedBox(height: AppTheme.spacingL),

                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : _connect,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppTheme.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppTheme.radiusMedium)),
                      ),
                      child: _isLoading
                        ? const SizedBox(width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : Text('Qo\'lda ulanish',
                            style: GoogleFonts.outfit(color: AppTheme.primary)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
