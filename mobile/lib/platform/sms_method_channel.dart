import 'package:flutter/services.dart';
import '../config/constants.dart';

class SmsMethodChannel {
  static const MethodChannel _channel = MethodChannel(AppConstants.smsChannel);

  Future<Map<String, dynamic>> sendSms({
    required String phoneNumber,
    required String message,
    required int simSlot,
  }) async {
    try {
      final result = await _channel.invokeMethod<Map>('sendSms', {
        'phoneNumber': phoneNumber,
        'message': message,
        'simSlot': simSlot,
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
