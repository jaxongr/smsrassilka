class AppConstants {
  AppConstants._();

  static const String appName = 'SMS Gateway';
  static const String appVersion = '1.2.1';

  // Default API URLs (overridden by user config)
  static const String defaultApiUrl = 'https://sms-gateway.example.com';
  static const String defaultWsUrl = 'wss://sms-gateway.example.com/ws/device';

  // WebSocket
  static const int wsReconnectBaseDelay = 1000; // ms
  static const int wsReconnectMaxDelay = 30000; // ms
  static const int wsPingInterval = 30; // seconds

  // SharedPreferences keys
  static const String keyServerUrl = 'server_url';
  static const String keyDeviceToken = 'device_token';
  static const String keyIsConfigured = 'is_configured';
  static const String keyGatewayActive = 'gateway_active';

  // Platform channels
  static const String smsChannel = 'com.smsgateway/sms';
  static const String callChannel = 'com.smsgateway/call';
  static const String simChannel = 'com.smsgateway/sim';

  // Stats
  static const String keySmsSentToday = 'sms_sent_today';
  static const String keyCallsMadeToday = 'calls_made_today';
  static const String keyFailedToday = 'failed_today';
  static const String keyStatsDate = 'stats_date';
}
