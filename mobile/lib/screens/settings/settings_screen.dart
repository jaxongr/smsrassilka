import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../providers/settings_provider.dart';
import '../../providers/connection_provider.dart';
import '../../services/permission_service.dart';
import '../../services/audio_service.dart';
import '../setup/setup_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _permissionService = PermissionService();
  final _audioService = AudioService();
  Map<String, bool> _permissions = {};
  bool _isLoadingPermissions = true;

  @override
  void initState() {
    super.initState();
    _loadPermissions();
  }

  Future<void> _loadPermissions() async {
    final perms = await _permissionService.checkPermissions();
    if (mounted) {
      setState(() {
        _permissions = perms;
        _isLoadingPermissions = false;
      });
    }
  }

  Future<void> _requestPermission(String type) async {
    bool granted = false;
    switch (type) {
      case 'sms':
        granted = await _permissionService.requestSmsPermission();
        break;
      case 'phone':
        granted = await _permissionService.requestPhonePermission();
        break;
      case 'notification':
        granted = await _permissionService.requestNotificationPermission();
        break;
    }
    setState(() {
      _permissions[type] = granted;
    });
  }

  Future<void> _clearCache() async {
    await _audioService.clearCache();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Kesh tozalandi',
            style: GoogleFonts.outfit(),
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );
    }
  }

  Future<void> _disconnect() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Chiqish',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        content: Text(
          'Haqiqatan ham chiqmoqchimisiz? Bu qurilmani serverdan uzadi.',
          style: GoogleFonts.outfit(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Bekor qilish',
              style: GoogleFonts.outfit(color: AppTheme.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Chiqish',
              style: GoogleFonts.outfit(color: AppTheme.errorColor),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(connectionProvider.notifier).disconnect();
      await ref.read(settingsProvider.notifier).clear();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const SetupScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      appBar: AppBar(
        title: const Text('Sozlamalar'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacingM),
        children: [
          // Server Config Section
          _buildSectionTitle('Server konfiguratsiyasi'),
          const SizedBox(height: AppTheme.spacingS),
          _buildSettingItem(
            icon: Icons.link,
            title: 'Server manzili',
            subtitle: settings.serverUrl.isNotEmpty
                ? settings.serverUrl
                : 'Sozlanmagan',
          ),
          const SizedBox(height: AppTheme.spacingS),
          _buildSettingItem(
            icon: Icons.key,
            title: 'Qurilma tokeni',
            subtitle: settings.deviceToken.isNotEmpty
                ? '${'*' * 8}${settings.deviceToken.substring(settings.deviceToken.length > 4 ? settings.deviceToken.length - 4 : 0)}'
                : 'Sozlanmagan',
          ),
          const SizedBox(height: AppTheme.spacingL),

          // Permissions Section
          _buildSectionTitle('Ruxsatlar'),
          const SizedBox(height: AppTheme.spacingS),
          if (_isLoadingPermissions)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(AppTheme.spacingM),
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            )
          else ...[
            _buildPermissionItem(
              'SMS',
              'sms',
              Icons.sms_outlined,
              _permissions['sms'] ?? false,
            ),
            const SizedBox(height: AppTheme.spacingS),
            _buildPermissionItem(
              'Telefon',
              'phone',
              Icons.call_outlined,
              _permissions['phone'] ?? false,
            ),
            const SizedBox(height: AppTheme.spacingS),
            _buildPermissionItem(
              'Bildirishnoma',
              'notification',
              Icons.notifications_outlined,
              _permissions['notification'] ?? false,
            ),
          ],
          const SizedBox(height: AppTheme.spacingL),

          // Actions Section
          _buildSectionTitle('Amallar'),
          const SizedBox(height: AppTheme.spacingS),

          // Clear Cache
          _buildActionButton(
            icon: Icons.cleaning_services_outlined,
            title: 'Keshni tozalash',
            onTap: _clearCache,
          ),
          const SizedBox(height: AppTheme.spacingS),

          // Disconnect
          _buildActionButton(
            icon: Icons.logout,
            title: 'Chiqish',
            onTap: _disconnect,
            isDestructive: true,
          ),
          const SizedBox(height: AppTheme.spacingXL),

          // App Version
          Center(
            child: Text(
              'SMS Gateway v${AppConstants.appVersion}',
              style: GoogleFonts.outfit(
                fontSize: 13,
                color: AppTheme.textHint,
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingM),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppTheme.textSecondary,
      ),
    );
  }

  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        border: Border.all(color: AppTheme.cardBorder),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primary),
          const SizedBox(width: AppTheme.spacingM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Text(
                  subtitle,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionItem(
    String title,
    String type,
    IconData icon,
    bool isGranted,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        border: Border.all(color: AppTheme.cardBorder),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primary),
          const SizedBox(width: AppTheme.spacingM),
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          if (isGranted)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacingS,
                vertical: AppTheme.spacingXS,
              ),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
              ),
              child: Text(
                'Berilgan',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.successColor,
                ),
              ),
            )
          else
            GestureDetector(
              onTap: () => _requestPermission(type),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingS,
                  vertical: AppTheme.spacingXS,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: Text(
                  'So\'rash',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spacingM),
        decoration: BoxDecoration(
          color: AppTheme.cardBg,
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
          border: Border.all(color: AppTheme.cardBorder),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isDestructive ? AppTheme.errorColor : AppTheme.primary,
            ),
            const SizedBox(width: AppTheme.spacingM),
            Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isDestructive ? AppTheme.errorColor : AppTheme.textPrimary,
              ),
            ),
            const Spacer(),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: AppTheme.textHint,
            ),
          ],
        ),
      ),
    );
  }
}
