import 'package:flutter/services.dart';
import '../config/constants.dart';
import '../models/sim_info.dart';

class SimMethodChannel {
  static const MethodChannel _channel = MethodChannel(AppConstants.simChannel);

  Future<List<SimInfo>> getSimCards() async {
    try {
      final result = await _channel.invokeMethod<List>('getSimCards');

      if (result == null) return [];

      return result
          .map((item) => SimInfo.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } on PlatformException catch (e) {
      throw Exception('SIM ma\'lumotlarini olishda xatolik: ${e.message}');
    }
  }
}
