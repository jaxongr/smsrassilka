import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class VoiceMessagesService {
  private readonly logger = new Logger(VoiceMessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.voiceMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, file: Express.Multer.File, name: string) {
    const relativePath = await this.storageService.save(
      file.buffer,
      file.originalname,
      'voice-messages',
    );

    // Estimate duration from file size (rough approximation for MP3: ~16KB per second at 128kbps)
    const estimatedDuration = Math.ceil(file.size / 16000);

    const voiceMessage = await this.prisma.voiceMessage.create({
      data: {
        name,
        fileName: file.originalname,
        filePath: relativePath,
        fileSize: file.size,
        duration: estimatedDuration,
        mimeType: file.mimetype || 'audio/mp3',
        userId,
      },
    });

    this.logger.log(`Voice message created: ${voiceMessage.id}`);

    return voiceMessage;
  }

  async findOne(id: string) {
    const voiceMessage = await this.prisma.voiceMessage.findUnique({
      where: { id },
    });

    if (!voiceMessage) {
      throw new NotFoundException(
        `Voice message with ID "${id}" not found`,
      );
    }

    return voiceMessage;
  }

  async remove(id: string) {
    const voiceMessage = await this.findOne(id);

    // Delete the file from storage
    await this.storageService.delete(voiceMessage.filePath);

    await this.prisma.voiceMessage.delete({ where: { id } });

    this.logger.log(`Voice message deleted: ${id}`);

    return voiceMessage;
  }

  async getFilePath(id: string): Promise<string> {
    const voiceMessage = await this.findOne(id);
    return this.storageService.getPath(voiceMessage.filePath);
  }
}
