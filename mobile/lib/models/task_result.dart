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

  String get serverStatus {
    switch (status) {
      case TaskStatus.success:
        return 'SENT';
      case TaskStatus.failed:
        return 'FAILED';
      case TaskStatus.timeout:
        return 'FAILED';
      case TaskStatus.cancelled:
        return 'CANCELLED';
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'taskId': taskId,
      'status': serverStatus,
      if (errorMessage != null) 'errorMessage': errorMessage,
      if (callDuration != null) 'callDuration': callDuration,
      if (callAnswered != null) 'callAnswered': callAnswered,
    };
  }

  @override
  String toString() => 'TaskResult(taskId: $taskId, status: ${status.name})';
}
