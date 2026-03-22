import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';

class AudioService {
  final Dio _dio = Dio();

  Future<String> _getCacheDir() async {
    final dir = await getApplicationCacheDirectory();
    final audioDir = Directory('${dir.path}/audio');
    if (!await audioDir.exists()) {
      await audioDir.create(recursive: true);
    }
    return audioDir.path;
  }

  Future<String> downloadAndCache(String url, String id) async {
    final cacheDir = await _getCacheDir();
    final extension = url.split('.').last.split('?').first;
    final filePath = '$cacheDir/$id.$extension';
    final file = File(filePath);

    if (await file.exists()) {
      return filePath;
    }

    await _dio.download(url, filePath);
    return filePath;
  }

  Future<bool> isDownloaded(String id) async {
    final cacheDir = await _getCacheDir();
    final dir = Directory(cacheDir);
    if (!await dir.exists()) return false;

    final files = dir.listSync();
    return files.any((f) => f.path.contains(id));
  }

  Future<String?> getLocalPath(String id) async {
    final cacheDir = await _getCacheDir();
    final dir = Directory(cacheDir);
    if (!await dir.exists()) return null;

    final files = dir.listSync();
    for (final file in files) {
      if (file.path.contains(id)) {
        return file.path;
      }
    }
    return null;
  }

  Future<void> clearCache() async {
    final cacheDir = await _getCacheDir();
    final dir = Directory(cacheDir);
    if (await dir.exists()) {
      await dir.delete(recursive: true);
    }
  }
}
