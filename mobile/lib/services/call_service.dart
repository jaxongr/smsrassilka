import 'dart:async';
import '../platform/call_method_channel.dart';
import '../models/call_task.dart';
import '../models/task_result.dart';

class CallService {
  final CallMethodChannel _channel = CallMethodChannel();

  Future<TaskResult> makeCall(CallTask task) async {
    try {
      // Timeout: maxDurationSec + 15 seconds buffer for ringing
      final timeout = Duration(seconds: task.maxDurationSec + 15);

      final result = await _channel.makeCall(
        phoneNumber: task.phoneNumber,
        voiceFileUrl: task.voiceFileUrl,
        simSlot: task.simSlot,
        maxDurationSec: task.maxDurationSec,
      ).timeout(timeout, onTimeout: () {
        return {
          'success': false,
          'error': 'Qo\'ng\'iroq vaqti tugadi (timeout)',
          'answered': false,
          'duration': 0,
        };
      });

      if (result['success'] == true) {
        return TaskResult(
          taskId: task.taskId,
          status: TaskStatus.success,
          callDuration: result['duration'] as int?,
          callAnswered: result['answered'] as bool?,
        );
      } else {
        return TaskResult(
          taskId: task.taskId,
          status: TaskStatus.failed,
          errorMessage: result['error'] as String? ?? 'Qo\'ng\'iroqda xatolik',
          callAnswered: false,
        );
      }
    } catch (e) {
      return TaskResult(
        taskId: task.taskId,
        status: TaskStatus.failed,
        errorMessage: e.toString(),
        callAnswered: false,
      );
    }
  }
}
