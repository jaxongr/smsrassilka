import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = 'app';
const APK_FILENAME = 'sms-gateway.apk';
const VERSION_KEY = 'app_version';

@Injectable()
export class AppDownloadService {
  private readonly logger = new Logger(AppDownloadService.name);
  private readonly appDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.appDir = path.resolve('./uploads', APP_DIR);
    this.ensureDirectoryExists();
  }

  async getAppInfo(): Promise<{
    version: string;
    fileName: string;
    fileSize: number;
    updatedAt: Date | null;
  }> {
    const filePath = this.getApkPath();
    const exists = fs.existsSync(filePath);

    if (!exists) {
      return {
        version: '0.0.0',
        fileName: APK_FILENAME,
        fileSize: 0,
        updatedAt: null,
      };
    }

    const stats = fs.statSync(filePath);
    const version = await this.getStoredVersion();

    return {
      version,
      fileName: APK_FILENAME,
      fileSize: stats.size,
      updatedAt: stats.mtime,
    };
  }

  getAppFilePath(): string {
    const filePath = this.getApkPath();

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('APK fayli topilmadi');
    }

    return filePath;
  }

  async uploadApp(
    file: Express.Multer.File,
    version: string,
  ): Promise<{ version: string; fileName: string; fileSize: number }> {
    this.ensureDirectoryExists();

    const filePath = this.getApkPath();
    await fs.promises.writeFile(filePath, file.buffer);

    await this.setStoredVersion(version);

    this.logger.log(`APK uploaded: version=${version}, size=${file.size}`);

    return {
      version,
      fileName: APK_FILENAME,
      fileSize: file.size,
    };
  }

  private getApkPath(): string {
    return path.join(this.appDir, APK_FILENAME);
  }

  private async getStoredVersion(): Promise<string> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: VERSION_KEY },
      });
      return setting?.value || '1.0.0';
    } catch {
      // If SystemSetting table doesn't exist yet, return default
      return '1.0.0';
    }
  }

  private async setStoredVersion(version: string): Promise<void> {
    try {
      await this.prisma.systemSetting.upsert({
        where: { key: VERSION_KEY },
        update: { value: version },
        create: { key: VERSION_KEY, value: version },
      });
    } catch (error) {
      this.logger.warn(
        `Could not save version to SystemSetting: ${error.message}`,
      );
    }
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.appDir)) {
      fs.mkdirSync(this.appDir, { recursive: true });
    }
  }
}
