class DeviceStatus {
  final int batteryLevel;
  final int signalStrength;
  final String networkType;
  final bool isCharging;

  const DeviceStatus({
    required this.batteryLevel,
    required this.signalStrength,
    required this.networkType,
    required this.isCharging,
  });

  Map<String, dynamic> toJson() {
    return {
      'batteryLevel': batteryLevel,
      'signalStrength': signalStrength,
      'networkType': networkType,
      'isCharging': isCharging,
    };
  }

  factory DeviceStatus.empty() {
    return const DeviceStatus(
      batteryLevel: 0,
      signalStrength: 0,
      networkType: 'unknown',
      isCharging: false,
    );
  }

  @override
  String toString() =>
      'DeviceStatus(battery: $batteryLevel%, signal: $signalStrength, network: $networkType)';
}
