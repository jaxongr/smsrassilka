import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('app.uploadDir', './uploads');
    this.ensureDirectoryExists(this.uploadDir);
  }

  /**
   * Save a file buffer to disk.
   * @param buffer - File content
   * @param originalName - Original file name (used for extension)
   * @param subDir - Optional subdirectory (e.g., 'voice-messages')
   * @returns Relative file path from upload directory
   */
  async save(
    buffer: Buffer,
    originalName: string,
    subDir?: string,
  ): Promise<string> {
    const ext = path.extname(originalName);
    const fileName = `${uuidv4()}${ext}`;
    const targetDir = subDir
      ? path.join(this.uploadDir, subDir)
      : this.uploadDir;

    this.ensureDirectoryExists(targetDir);

    const filePath = path.join(targetDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    this.logger.log(`File saved: ${filePath}`);

    return subDir ? path.join(subDir, fileName) : fileName;
  }

  /**
   * Delete a file from disk.
   * @param relativePath - Relative path from upload directory
   */
  async delete(relativePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, relativePath);

    try {
      await fs.promises.unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`File not found for deletion: ${filePath}`);
    }
  }

  /**
   * Get the absolute path for a stored file.
   * @param relativePath - Relative path from upload directory
   * @returns Absolute file path
   */
  getPath(relativePath: string): string {
    return path.resolve(this.uploadDir, relativePath);
  }

  /**
   * Check if a file exists.
   * @param relativePath - Relative path from upload directory
   */
  async exists(relativePath: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, relativePath);
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
