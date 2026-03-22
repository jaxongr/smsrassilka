import 'package:flutter_riverpod/flutter_riverpod.dart';

enum TaskType { sms, call }

enum TaskItemStatus { pending, processing, success, failed }

class TaskQueueItem {
  final String taskId;
  final TaskType type;
  final String phoneNumber;
  final TaskItemStatus status;
  final DateTime timestamp;
  final String? errorMessage;

  const TaskQueueItem({
    required this.taskId,
    required this.type,
    required this.phoneNumber,
    required this.status,
    required this.timestamp,
    this.errorMessage,
  });

  TaskQueueItem copyWith({
    TaskItemStatus? status,
    String? errorMessage,
  }) {
    return TaskQueueItem(
      taskId: taskId,
      type: type,
      phoneNumber: phoneNumber,
      status: status ?? this.status,
      timestamp: timestamp,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class TaskQueueNotifier extends StateNotifier<List<TaskQueueItem>> {
  TaskQueueNotifier() : super([]);

  static const int _maxItems = 100;

  void addTask(TaskQueueItem task) {
    state = [task, ...state];
    if (state.length > _maxItems) {
      state = state.sublist(0, _maxItems);
    }
  }

  void updateTaskStatus(String taskId, TaskItemStatus status, {String? error}) {
    state = state.map((item) {
      if (item.taskId == taskId) {
        return item.copyWith(status: status, errorMessage: error);
      }
      return item;
    }).toList();
  }

  void clearAll() {
    state = [];
  }

  List<TaskQueueItem> getByType(TaskType type) {
    return state.where((item) => item.type == type).toList();
  }

  List<TaskQueueItem> getByStatus(TaskItemStatus status) {
    return state.where((item) => item.status == status).toList();
  }

  List<TaskQueueItem> get recentTasks =>
      state.length > 10 ? state.sublist(0, 10) : state;
}

final taskQueueProvider =
    StateNotifierProvider<TaskQueueNotifier, List<TaskQueueItem>>((ref) {
  return TaskQueueNotifier();
});
