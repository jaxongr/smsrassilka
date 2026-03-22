import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class StatsState {
  final int smsSentToday;
  final int callsMadeToday;
  final int failedToday;

  const StatsState({
    this.smsSentToday = 0,
    this.callsMadeToday = 0,
    this.failedToday = 0,
  });

  StatsState copyWith({
    int? smsSentToday,
    int? callsMadeToday,
    int? failedToday,
  }) {
    return StatsState(
      smsSentToday: smsSentToday ?? this.smsSentToday,
      callsMadeToday: callsMadeToday ?? this.callsMadeToday,
      failedToday: failedToday ?? this.failedToday,
    );
  }
}

class StatsNotifier extends StateNotifier<StatsState> {
  StatsNotifier() : super(const StatsState()) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final savedDate = prefs.getString(AppConstants.keyStatsDate) ?? '';
    final today = DateTime.now().toIso8601String().substring(0, 10);

    if (savedDate != today) {
      // Reset stats for new day
      await prefs.setString(AppConstants.keyStatsDate, today);
      await prefs.setInt(AppConstants.keySmsSentToday, 0);
      await prefs.setInt(AppConstants.keyCallsMadeToday, 0);
      await prefs.setInt(AppConstants.keyFailedToday, 0);
      state = const StatsState();
    } else {
      state = StatsState(
        smsSentToday: prefs.getInt(AppConstants.keySmsSentToday) ?? 0,
        callsMadeToday: prefs.getInt(AppConstants.keyCallsMadeToday) ?? 0,
        failedToday: prefs.getInt(AppConstants.keyFailedToday) ?? 0,
      );
    }
  }

  Future<void> incrementSmsSent() async {
    final newValue = state.smsSentToday + 1;
    state = state.copyWith(smsSentToday: newValue);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(AppConstants.keySmsSentToday, newValue);
  }

  Future<void> incrementCallsMade() async {
    final newValue = state.callsMadeToday + 1;
    state = state.copyWith(callsMadeToday: newValue);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(AppConstants.keyCallsMadeToday, newValue);
  }

  Future<void> incrementFailed() async {
    final newValue = state.failedToday + 1;
    state = state.copyWith(failedToday: newValue);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(AppConstants.keyFailedToday, newValue);
  }

  Future<void> reset() async {
    state = const StatsState();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(AppConstants.keySmsSentToday, 0);
    await prefs.setInt(AppConstants.keyCallsMadeToday, 0);
    await prefs.setInt(AppConstants.keyFailedToday, 0);
  }
}

final statsProvider =
    StateNotifierProvider<StatsNotifier, StatsState>((ref) {
  return StatsNotifier();
});
