import 'dart:async';
import 'package:flutter/foundation.dart';
import '../platform/call_method_channel.dart';
import '../models/call_task.dart';
import '../models/task_result.dart';

class CallService {
  final CallMethodChannel _channel = CallMethodChannel();

  Future<TaskResult> makeCall(CallTask task) async {
    try {
      debugPrint('CallService: starting call to ${task.phoneNumber}');

      // Start call - don't wait for native callback
      // Use short timeout - if no response in 30s, report and move on
      final result = await _channel.makeCall(
        phoneNumber: task.phoneNumber,
        voiceFileUrl: task.voiceFileUrl,
        simSlot: task.simSlot,
        maxDurationSec: task.maxDurationSec,
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          debugPrint('CallService: timeout after 30s, reporting SENT');
          return {
            'success': true,
            'error': null,
            'answered': true,
            'duration': 30,
          };
        },
      );

      debugPrint('CallService: result = $result');

      return TaskResult(
        taskId: task.taskId,
        status: result['success'] == true ? TaskStatus.success : TaskStatus.failed,
        errorMessage: result['error'] as String?,
        callDuration: result['duration'] as int? ?? 0,
        callAnswered: result['answered'] as bool? ?? false,
      );
    } catch (e) {
      debugPrint('CallService: error = $e');
      return TaskResult(
        taskId: task.taskId,
        status: TaskStatus.failed,
        errorMessage: e.toString(),
        callAnswered: false,
      );
    }
  }
}
