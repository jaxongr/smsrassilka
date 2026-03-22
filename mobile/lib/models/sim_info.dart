class SimInfo {
  final int slotIndex;
  final String operatorName;
  final String? phoneNumber;
  final bool smsCapable;
  final bool callCapable;

  const SimInfo({
    required this.slotIndex,
    required this.operatorName,
    this.phoneNumber,
    this.smsCapable = true,
    this.callCapable = true,
  });

  factory SimInfo.fromJson(Map<String, dynamic> json) {
    return SimInfo(
      slotIndex: json['slotIndex'] as int,
      operatorName: json['operatorName'] as String? ?? 'Noma\'lum',
      phoneNumber: json['phoneNumber'] as String?,
      smsCapable: json['smsCapable'] as bool? ?? true,
      callCapable: json['callCapable'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slotIndex': slotIndex,
      'operatorName': operatorName,
      'phoneNumber': phoneNumber,
      'smsCapable': smsCapable,
      'callCapable': callCapable,
    };
  }

  @override
  String toString() => 'SimInfo(slot: $slotIndex, operator: $operatorName)';
}
