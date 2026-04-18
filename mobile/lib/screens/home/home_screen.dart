import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../providers/connection_provider.dart';
import '../../providers/stats_provider.dart';
import '../../providers/task_queue_provider.dart';
import '../../services/websocket_service.dart' as ws;
import '../../services/battery_service.dart';
import '../../platform/sim_method_channel.dart';
import '../../models/sim_info.dart';
import '../../widgets/status_card.dart';
import '../../widgets/sim_card_widget.dart';
import '../../widgets/task_list_tile.dart';
import '../../widgets/connection_indicator.dart';
import '../dark_mode_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final BatteryService _batteryService = BatteryService();
  final SimMethodChannel _simChannel = SimMethodChannel();
  int _batteryLevel = 0;
  bool _isCharging = false;
  List<SimInfo> _simCards = [];

  @override
  void initState() {
    super.initState();
    _loadDeviceInfo();
  }

  Future<void> _loadDeviceInfo() async {
    final battery = await _batteryService.getBatteryLevel();
    final charging = await _batteryService.isCharging();
    List<SimInfo> sims = [];
    try {
      sims = await _simChannel.getSimCards();
    } catch (_) {}

    if (mounted) {
      setState(() {
        _batteryLevel = battery;
        _isCharging = charging;
        _simCards = sims;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectionState = ref.watch(connectionProvider);
    final stats = ref.watch(statsProvider);
    final tasks = ref.watch(taskQueueProvider);
    final connectionNotifier = ref.read(connectionProvider.notifier);
    final recentTasks = tasks.length > 10 ? tasks.sublist(0, 10) : tasks;

    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('SMS Gateway'),
            const SizedBox(width: AppTheme.spacingS),
            ConnectionIndicator(connectionState: connectionState),
          ],
        ),
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadDeviceInfo,
        child: ListView(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          children: [
            // Connection Status Card
            _buildConnectionCard(connectionState),
            const SizedBox(height: AppTheme.spacingM),

            // SIM Cards
            ..._buildSimCards(),
            const SizedBox(height: AppTheme.spacingM),

            // Battery & Signal Row
            Row(
              children: [
                Expanded(
                  child: StatusCard(
                    icon: _isCharging ? Icons.battery_charging_full : Icons.battery_std,
                    title: 'Batareya',
                    value: '$_batteryLevel%',
                    iconColor: _batteryLevel > 20
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: StatusCard(
                    icon: Icons.signal_cellular_alt,
                    title: 'Tarmoq',
                    value: _simCards.isNotEmpty ? 'Faol' : 'Yo\'q',
                    iconColor: _simCards.isNotEmpty
                        ? AppTheme.successColor
                        : AppTheme.textHint,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingM),

            // Today's Stats
            Row(
              children: [
                Expanded(
                  child: StatusCard(
                    icon: Icons.sms_outlined,
                    title: 'SMS yuborildi',
                    value: '${stats.smsSentToday}',
                    iconColor: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingS),
                Expanded(
                  child: StatusCard(
                    icon: Icons.call_outlined,
                    title: 'Qo\'ng\'iroqlar',
                    value: '${stats.callsMadeToday}',
                    iconColor: AppTheme.accent,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingS),
                Expanded(
                  child: StatusCard(
                    icon: Icons.error_outline,
                    title: 'Xatolar',
                    value: '${stats.failedToday}',
                    iconColor: AppTheme.errorColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingM),

            // Status: Gateway faol (avtomatik)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingM, horizontal: AppTheme.spacingL),
              decoration: BoxDecoration(
                color: connectionState == ws.ConnectionState.connected
                    ? AppTheme.successColor.withOpacity(0.1)
                    : AppTheme.warningColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    connectionState == ws.ConnectionState.connected
                        ? Icons.check_circle
                        : Icons.sync,
                    color: connectionState == ws.ConnectionState.connected
                        ? AppTheme.successColor
                        : AppTheme.warningColor,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    connectionState == ws.ConnectionState.connected
                        ? 'Gateway faol - tayyor'
                        : 'Ulanmoqda...',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: connectionState == ws.ConnectionState.connected
                          ? AppTheme.successColor
                          : AppTheme.warningColor,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingS),

            // Qorong'u rejim tugmasi - ekran o'chmasdan SMS yuborish uchun
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const DarkModeScreen(),
                  ));
                },
                icon: const Icon(Icons.nightlight_round, size: 18),
                label: const Text('Qorong\'u rejim (ekran ochilmaydi)'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.textSecondary,
                  side: BorderSide(color: AppTheme.cardBorder),
                  padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingM),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Recent Activity
            if (recentTasks.isNotEmpty) ...[
              Text(
                'So\'nggi faoliyat',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: AppTheme.spacingM),
              ...recentTasks.map((task) => TaskListTile(task: task)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionCard(ws.ConnectionState connectionState) {
    final isConnected = connectionState == ws.ConnectionState.connected;
    final isReconnecting = connectionState == ws.ConnectionState.reconnecting;

    String statusText;
    String subtitleText;

    switch (connectionState) {
      case ws.ConnectionState.connected:
        statusText = 'Ulangan';
        subtitleText = 'Server bilan aloqa o\'rnatilgan';
        break;
      case ws.ConnectionState.connecting:
        statusText = 'Ulanmoqda...';
        subtitleText = 'Serverga ulanish amalga oshirilmoqda';
        break;
      case ws.ConnectionState.reconnecting:
        statusText = 'Qayta ulanmoqda...';
        subtitleText = 'Aloqa uzildi, qayta ulanish jarayonida';
        break;
      case ws.ConnectionState.disconnected:
        statusText = 'Uzilgan';
        subtitleText = 'Server bilan aloqa yo\'q';
        break;
    }

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingL),
      decoration: BoxDecoration(
        gradient: isConnected ? AppTheme.walletGradient : null,
        color: isConnected
            ? null
            : isReconnecting
                ? AppTheme.warningColor.withOpacity(0.1)
                : AppTheme.errorColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        border: isConnected
            ? null
            : Border.all(
                color: isReconnecting
                    ? AppTheme.warningColor.withOpacity(0.3)
                    : AppTheme.errorColor.withOpacity(0.3),
              ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(isConnected ? 0.2 : 0.8),
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
            ),
            child: Icon(
              isConnected
                  ? Icons.cloud_done_outlined
                  : Icons.cloud_off_outlined,
              color: isConnected ? Colors.white : AppTheme.errorColor,
              size: 24,
            ),
          ),
          const SizedBox(width: AppTheme.spacingM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  statusText,
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: isConnected ? Colors.white : AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Text(
                  subtitleText,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: isConnected
                        ? Colors.white.withOpacity(0.8)
                        : AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildSimCards() {
    final widgets = <Widget>[];

    // Always show at least SIM 1 and SIM 2 slots
    for (int i = 0; i < 2; i++) {
      final simInfo = _simCards.length > i ? _simCards[i] : null;
      widgets.add(SimCardWidget(
        simInfo: simInfo,
        slotIndex: i,
      ));
      if (i == 0) {
        widgets.add(const SizedBox(height: AppTheme.spacingS));
      }
    }

    return widgets;
  }
}
