import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppDownloadModule } from './modules/app-download/app-download.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig],
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password', ''),
        },
      }),
    }),

    PrismaModule,
    RedisModule,
    StorageModule,
    HealthModule,

    // Feature modules:
    AuthModule,
    UsersModule,
    AppDownloadModule,
    // DevicesModule,
    // ContactsModule,
    // CampaignsModule,
    // VoiceMessagesModule,
    // TaskQueueModule,
    // GatewayModule,
    // BlacklistModule,
    // InboxModule,
    // AnalyticsModule,
  ],
})
export class AppModule {}
