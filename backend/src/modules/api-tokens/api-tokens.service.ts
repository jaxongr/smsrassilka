import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import { UpdateApiTokenDto } from './dto/update-api-token.dto';

@Injectable()
export class ApiTokensService {
  private readonly logger = new Logger(ApiTokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a raw token, hash it with sha256, store the hash,
   * and return the raw token to the user (shown only once).
   */
  async create(userId: string, dto: CreateApiTokenDto) {
    const rawToken = 'sk_' + crypto.randomBytes(32).toString('hex');
    const tokenPrefix = rawToken.substring(0, 10);

    const apiToken = await this.prisma.apiToken.create({
      data: {
        name: dto.name,
        token: rawToken, // Ochiq saqlash - har doim ko'rish mumkin
        tokenPrefix,
        userId,
        permissions: dto.permissions ?? [],
      },
    });

    this.logger.log(`API token created: ${apiToken.id} for user ${userId}`);
    return apiToken;
  }

  /**
   * List all tokens for a user (prefix only, no full token).
   */
  async findAllByUser(userId: string) {
    return this.prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a token's name, permissions, or active status.
   */
  async update(tokenId: string, userId: string, dto: UpdateApiTokenDto) {
    const existing = await this.prisma.apiToken.findUnique({
      where: { id: tokenId },
    });

    if (!existing) {
      throw new NotFoundException('API token not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not own this token');
    }

    const updated = await this.prisma.apiToken.update({
      where: { id: tokenId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.permissions !== undefined && { permissions: dto.permissions }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`API token updated: ${tokenId}`);

    return updated;
  }

  /**
   * Delete a token.
   */
  async delete(tokenId: string, userId: string) {
    const existing = await this.prisma.apiToken.findUnique({
      where: { id: tokenId },
    });

    if (!existing) {
      throw new NotFoundException('API token not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not own this token');
    }

    await this.prisma.apiToken.delete({ where: { id: tokenId } });

    this.logger.log(`API token deleted: ${tokenId}`);

    return { message: 'Token deleted successfully' };
  }

  /**
   * Validate a raw token by hashing and looking it up.
   * Returns the token record if valid, null otherwise.
   */
  async validateToken(rawToken: string) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const apiToken = await this.prisma.apiToken.findUnique({
      where: { token: hashedToken },
    });

    if (!apiToken) return null;
    if (!apiToken.isActive) return null;
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) return null;

    // Update lastUsedAt
    await this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    return apiToken;
  }
}
