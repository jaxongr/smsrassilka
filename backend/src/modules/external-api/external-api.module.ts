import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    SubscriptionsModule,
    BullModule.registerQueue(
      { name: 'sms-tasks' },
      { name: 'call-tasks' },
    ),
  ],
  controllers: [ExternalApiController],
  providers: [ExternalApiService],
  exports: [ExternalApiService],
})
export class ExternalApiModule {}
