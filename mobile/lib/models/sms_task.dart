class SmsTask {
  final String taskId;
  final String phoneNumber;
  final String message;
  final int simSlot;

  const SmsTask({
    required this.taskId,
    required this.phoneNumber,
    required this.message,
    required this.simSlot,
  });

  factory SmsTask.fromJson(Map<String, dynamic> json) {
    return SmsTask(
      taskId: json['taskId'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      message: (json['messageBody'] ?? json['message'] ?? '') as String,
      simSlot: json['simSlot'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'taskId': taskId,
      'phoneNumber': phoneNumber,
      'message': message,
      'simSlot': simSlot,
    };
  }

  @override
  String toString() => 'SmsTask(taskId: $taskId, phone: $phoneNumber, sim: $simSlot)';
}
