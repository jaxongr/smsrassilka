import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  Future<Map<String, bool>> requestAllPermissions() async {
    final statuses = await [
      Permission.sms,
      Permission.phone,
      Permission.notification,
    ].request();

    return {
      'sms': statuses[Permission.sms]?.isGranted ?? false,
      'phone': statuses[Permission.phone]?.isGranted ?? false,
      'notification': statuses[Permission.notification]?.isGranted ?? false,
    };
  }

  Future<Map<String, bool>> checkPermissions() async {
    final sms = await Permission.sms.status;
    final phone = await Permission.phone.status;
    final notification = await Permission.notification.status;

    return {
      'sms': sms.isGranted,
      'phone': phone.isGranted,
      'notification': notification.isGranted,
    };
  }

  Future<bool> requestSmsPermission() async {
    final status = await Permission.sms.request();
    return status.isGranted;
  }

  Future<bool> requestPhonePermission() async {
    final status = await Permission.phone.request();
    return status.isGranted;
  }

  Future<bool> requestNotificationPermission() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }
}
