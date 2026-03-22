import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TaskQueueService } from './task-queue.service';

@Processor('sms-tasks')
export class SmsTaskProcessor {
  private readonly logger = new Logger(SmsTaskProcessor.name);

  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Process()
  async handleSmsTask(job: Job<{ taskId: string; campaignId: string }>) {
    this.logger.debug(`Processing SMS task ${job.data.taskId}`);
    await this.taskQueueService.processTask(job.data.taskId, job.data.campaignId);
  }

  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(
      `SMS task ${job.data.taskId} failed: ${error.message}`,
      error.stack,
    );
  }
}

@Processor('call-tasks')
export class CallTaskProcessor {
  private readonly logger = new Logger(CallTaskProcessor.name);

  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Process()
  async handleCallTask(job: Job<{ taskId: string; campaignId: string }>) {
    this.logger.debug(`Processing CALL task ${job.data.taskId}`);
    await this.taskQueueService.processTask(job.data.taskId, job.data.campaignId);
  }

  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(
      `Call task ${job.data.taskId} failed: ${error.message}`,
      error.stack,
    );
  }
}
