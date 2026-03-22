import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { DeviceGateway } from './device.gateway';
import { DashboardGateway } from './dashboard.gateway';
import { TaskQueueModule } from '../task-queue/task-queue.module';
import { ModuleRef } from '@nestjs/core';
import { TaskQueueService } from '../task-queue/task-queue.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => TaskQueueModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret', 'jwt-secret'),
      }),
    }),
  ],
  providers: [DeviceGateway, DashboardGateway],
  exports: [DeviceGateway, DashboardGateway],
})
export class GatewayModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly deviceGateway: DeviceGateway,
  ) {}

  async onModuleInit() {
    // Resolve circular dependency: inject TaskQueueService into DeviceGateway
    const taskQueueService = this.moduleRef.get(TaskQueueService, { strict: false });
    this.deviceGateway.setTaskQueueService(taskQueueService);
  }
}
