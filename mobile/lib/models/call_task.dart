class CallTask {
  final String taskId;
  final String phoneNumber;
  final String? voiceFileUrl;
  final int simSlot;
  final int maxDurationSec;

  const CallTask({
    required this.taskId,
    required this.phoneNumber,
    this.voiceFileUrl,
    required this.simSlot,
    this.maxDurationSec = 60,
  });

  factory CallTask.fromJson(Map<String, dynamic> json) {
    return CallTask(
      taskId: json['taskId'] as String,
      phoneNumber: json['phoneNumber'] as String,
      voiceFileUrl: json['voiceFileUrl'] as String?,
      simSlot: json['simSlot'] as int? ?? 0,
      maxDurationSec: json['maxDurationSec'] as int? ?? 60,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'taskId': taskId,
      'phoneNumber': phoneNumber,
      'voiceFileUrl': voiceFileUrl,
      'simSlot': simSlot,
      'maxDurationSec': maxDurationSec,
    };
  }

  @override
  String toString() => 'CallTask(taskId: $taskId, phone: $phoneNumber, sim: $simSlot)';
}
