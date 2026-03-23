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
import { DevicesModule } from './modules/devices/devices.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { VoiceMessagesModule } from './modules/voice-messages/voice-messages.module';
import { TaskQueueModule } from './modules/task-queue/task-queue.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { BlacklistModule } from './modules/blacklist/blacklist.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module';
import { ExternalApiModule } from './modules/external-api/external-api.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

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
    AuthModule,
    UsersModule,
    AppDownloadModule,
    DevicesModule,
    ContactsModule,
    CampaignsModule,
    VoiceMessagesModule,
    TaskQueueModule,
    GatewayModule,
    BlacklistModule,
    InboxModule,
    AnalyticsModule,
    ApiTokensModule,
    ExternalApiModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
