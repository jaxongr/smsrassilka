import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class SettingsState {
  final String serverUrl;
  final String deviceToken;
  final bool isConfigured;
  final bool isLoading;

  const SettingsState({
    this.serverUrl = '',
    this.deviceToken = '',
    this.isConfigured = false,
    this.isLoading = true,
  });

  SettingsState copyWith({
    String? serverUrl,
    String? deviceToken,
    bool? isConfigured,
    bool? isLoading,
  }) {
    return SettingsState(
      serverUrl: serverUrl ?? this.serverUrl,
      deviceToken: deviceToken ?? this.deviceToken,
      isConfigured: isConfigured ?? this.isConfigured,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class SettingsNotifier extends StateNotifier<SettingsState> {
  SettingsNotifier() : super(const SettingsState()) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = SettingsState(
      serverUrl: prefs.getString(AppConstants.keyServerUrl) ?? '',
      deviceToken: prefs.getString(AppConstants.keyDeviceToken) ?? '',
      isConfigured: prefs.getBool(AppConstants.keyIsConfigured) ?? false,
      isLoading: false,
    );
  }

  Future<void> save({
    required String serverUrl,
    required String deviceToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyServerUrl, serverUrl);
    await prefs.setString(AppConstants.keyDeviceToken, deviceToken);
    await prefs.setBool(AppConstants.keyIsConfigured, true);

    state = state.copyWith(
      serverUrl: serverUrl,
      deviceToken: deviceToken,
      isConfigured: true,
    );
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyServerUrl);
    await prefs.remove(AppConstants.keyDeviceToken);
    await prefs.setBool(AppConstants.keyIsConfigured, false);

    state = const SettingsState(isLoading: false);
  }
}

final settingsProvider =
    StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  return SettingsNotifier();
});
