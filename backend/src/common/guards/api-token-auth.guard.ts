import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ApiTokenAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiTokenAuthGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawToken = request.headers['x-api-key'];

    if (!rawToken) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    // Hash the raw token with sha256
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Look up in ApiToken table
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { token: hashedToken },
    });

    if (!apiToken) {
      throw new UnauthorizedException('Invalid API token');
    }

    if (!apiToken.isActive) {
      throw new UnauthorizedException('API token is deactivated');
    }

    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      throw new UnauthorizedException('API token has expired');
    }

    // Check rate limit via Redis
    const rateLimitKey = `api:rate:${apiToken.id}`;
    const currentCount = await this.redisService.incr(rateLimitKey);

    // Set TTL on first request in window
    if (currentCount === 1) {
      await this.redisService.expire(rateLimitKey, 60);
    }

    if (currentCount > apiToken.rateLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Max ${apiToken.rateLimit} requests per minute.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Update lastUsedAt (fire and forget)
    this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    }).catch((err) => {
      this.logger.warn(`Failed to update lastUsedAt for token ${apiToken.id}: ${err.message}`);
    });

    // Attach userId and token info to request
    request.user = {
      sub: apiToken.userId,
      tokenId: apiToken.id,
      permissions: apiToken.permissions,
    };

    return true;
  }
}
