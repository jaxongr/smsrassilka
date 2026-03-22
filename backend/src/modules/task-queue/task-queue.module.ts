import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { TaskQueueService } from './task-queue.service';
import { SmsTaskProcessor, CallTaskProcessor } from './task-queue.processor';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => GatewayModule),
    BullModule.registerQueue(
      { name: 'sms-tasks' },
      { name: 'call-tasks' },
      { name: 'campaign-init' },
    ),
  ],
  providers: [TaskQueueService, SmsTaskProcessor, CallTaskProcessor],
  exports: [TaskQueueService],
})
export class TaskQueueModule {}
