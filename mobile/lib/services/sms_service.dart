import '../platform/sms_method_channel.dart';
import '../models/sms_task.dart';
import '../models/task_result.dart';

class SmsService {
  final SmsMethodChannel _channel = SmsMethodChannel();

  Future<TaskResult> sendSms(SmsTask task) async {
    try {
      final result = await _channel.sendSms(
        phoneNumber: task.phoneNumber,
        message: task.message,
        simSlot: task.simSlot,
      );

      if (result['success'] == true) {
        return TaskResult(
          taskId: task.taskId,
          status: TaskStatus.success,
        );
      } else {
        return TaskResult(
          taskId: task.taskId,
          status: TaskStatus.failed,
          errorMessage: result['error'] as String? ?? 'SMS yuborishda xatolik',
        );
      }
    } catch (e) {
      return TaskResult(
        taskId: task.taskId,
        status: TaskStatus.failed,
        errorMessage: e.toString(),
      );
    }
  }
}
