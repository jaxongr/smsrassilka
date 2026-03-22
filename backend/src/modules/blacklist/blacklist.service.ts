import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BlacklistService {
  private readonly logger = new Logger(BlacklistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.blacklist.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.blacklist.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async add(phoneNumber: string, reason: string | undefined, userId: string) {
    const existing = await this.prisma.blacklist.findUnique({
      where: { phoneNumber },
    });

    if (existing) {
      throw new ConflictException(
        `Phone number "${phoneNumber}" is already in the blacklist`,
      );
    }

    const entry = await this.prisma.blacklist.create({
      data: { phoneNumber, reason, userId },
    });

    // Mark all matching contacts as blacklisted
    await this.prisma.contact.updateMany({
      where: { phoneNumber },
      data: { isBlacklisted: true },
    });

    this.logger.log(`Added ${phoneNumber} to blacklist`);

    return entry;
  }

  async remove(id: string) {
    const entry = await this.prisma.blacklist.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Blacklist entry with ID "${id}" not found`);
    }

    await this.prisma.blacklist.delete({ where: { id } });

    // Unset blacklisted flag on matching contacts
    await this.prisma.contact.updateMany({
      where: { phoneNumber: entry.phoneNumber },
      data: { isBlacklisted: false },
    });

    this.logger.log(`Removed ${entry.phoneNumber} from blacklist`);

    return entry;
  }

  async isBlacklisted(phoneNumber: string): Promise<boolean> {
    const entry = await this.prisma.blacklist.findUnique({
      where: { phoneNumber },
    });

    return !!entry;
  }

  async importFromFile(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith('phone'));

    if (!lines.length) {
      throw new BadRequestException('No valid phone numbers found in file');
    }

    let imported = 0;

    for (const phoneNumber of lines) {
      try {
        await this.prisma.blacklist.create({
          data: { phoneNumber, userId },
        });

        await this.prisma.contact.updateMany({
          where: { phoneNumber },
          data: { isBlacklisted: true },
        });

        imported++;
      } catch {
        // Skip duplicates
      }
    }

    this.logger.log(`Imported ${imported} phone numbers to blacklist`);

    return {
      imported,
      total: lines.length,
    };
  }
}
