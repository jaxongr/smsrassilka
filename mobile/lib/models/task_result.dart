enum TaskStatus { success, failed, timeout, cancelled }

class TaskResult {
  final String taskId;
  final TaskStatus status;
  final String? errorMessage;
  final int? callDuration;
  final bool? callAnswered;

  const TaskResult({
    required this.taskId,
    required this.status,
    this.errorMessage,
    this.callDuration,
    this.callAnswered,
  });

  Map<String, dynamic> toJson() {
    return {
      'taskId': taskId,
      'status': status.name,
      'errorMessage': errorMessage,
      'callDuration': callDuration,
      'callAnswered': callAnswered,
    };
  }

  @override
  String toString() => 'TaskResult(taskId: $taskId, status: ${status.name})';
}
