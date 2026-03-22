class Environment {
  Environment._();

  static const bool isProduction = bool.fromEnvironment('dart.vm.product');

  static String get apiBaseUrl {
    if (isProduction) {
      return const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'https://sms-gateway.example.com',
      );
    }
    return const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:3000',
    );
  }

  static String get wsBaseUrl {
    if (isProduction) {
      return const String.fromEnvironment(
        'WS_BASE_URL',
        defaultValue: 'wss://sms-gateway.example.com',
      );
    }
    return const String.fromEnvironment(
      'WS_BASE_URL',
      defaultValue: 'ws://10.0.2.2:3000',
    );
  }

  static const int connectTimeout = 10000;
  static const int receiveTimeout = 15000;
}
