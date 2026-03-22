import 'package:flutter/services.dart';
import '../config/constants.dart';

class CallMethodChannel {
  static const MethodChannel _channel = MethodChannel(AppConstants.callChannel);

  Future<Map<String, dynamic>> makeCall({
    required String phoneNumber,
    String? voiceFileUrl,
    required int simSlot,
    required int maxDurationSec,
  }) async {
    try {
      final result = await _channel.invokeMethod<Map>('makeCall', {
        'phoneNumber': phoneNumber,
        'voiceFileUrl': voiceFileUrl,
        'simSlot': simSlot,
        'maxDurationSec': maxDurationSec,
      });

      return Map<String, dynamic>.from(result ?? {});
    } on PlatformException catch (e) {
      return {
        'success': false,
        'error': e.message ?? 'Platform xatolik',
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}
