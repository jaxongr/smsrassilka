import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TaskStatus, CampaignType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { DeviceGateway } from '../gateway/device.gateway';
import { DashboardGateway } from '../gateway/dashboard.gateway';

const BATCH_SIZE = 500;

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @InjectQueue('sms-tasks') private readonly smsQueue: Queue,
    @InjectQueue('call-tasks') private readonly callQueue: Queue,
    private readonly deviceGateway: DeviceGateway,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async initCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        contactGroup: {
          include: {
            contacts: {
              where: { isBlacklisted: false },
              select: { id: true, phoneNumber: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const contacts = campaign.contactGroup.contacts;

    // Check for already existing pending tasks (e.g., on resume)
    const existingPendingCount = await this.prisma.taskLog.count({
      where: { campaignId, status: { in: [TaskStatus.PENDING, TaskStatus.QUEUED] } },
    });

    if (existingPendingCount > 0) {
      await this.requeuePendingTasks(campaignId, campaign);
      return;
    }

    // Create new task logs in batches
    let totalCreated = 0;

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);

      const taskData = batch.map((contact) => {
        let messageBody = campaign.messageTemplate ?? '';
        if (contact.firstName) {
          messageBody = messageBody.replace(/\{firstName\}/g, contact.firstName);
        }
        if (contact.lastName) {
          messageBody = messageBody.replace(/\{lastName\}/g, contact.lastName);
        }
        messageBody = messageBody.replace(/\{phoneNumber\}/g, contact.phoneNumber);

        return {
          campaignId,
          contactId: contact.id,
          phoneNumber: contact.phoneNumber,
          type: campaign.type,
          messageBody: campaign.type === CampaignType.SMS ? messageBody : null,
          status: TaskStatus.PENDING,
          maxAttempts: 3,
        };
      });

      await this.prisma.taskLog.createMany({ data: taskData });
      totalCreated += batch.length;
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { totalCount: totalCreated },
    });

    // Get online devices for this campaign
    const onlineDeviceCount = await this.prisma.device.count({
      where: { id: { in: campaign.deviceIds }, isOnline: true },
    });
    const deviceCount = Math.max(onlineDeviceCount, 1);

    // SemySMS-style: send one task per device, wait for result, then send next
    // Each online device gets one task immediately
    // When task_result comes back, next PENDING task is queued for that device
    const onlineDevices = await this.prisma.device.findMany({
      where: { id: { in: campaign.deviceIds }, isOnline: true },
      select: { id: true },
    });

    const pendingTasks = await this.prisma.taskLog.findMany({
      where: { campaignId, status: TaskStatus.PENDING },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: Math.max(onlineDevices.length, 1),
    });

    const queue = campaign.type === CampaignType.CALL ? this.callQueue : this.smsQueue;

    for (let i = 0; i < pendingTasks.length; i++) {
      await queue.add(
        { taskId: pendingTasks[i].id, campaignId },
        { delay: i * 100, attempts: 3, backoff: { type: 'exponential' as const, delay: 5000 }, removeOnComplete: true },
      );
      await this.prisma.taskLog.update({
        where: { id: pendingTasks[i].id },
        data: { status: TaskStatus.QUEUED },
      });
    }

    this.logger.log(
      `Campaign ${campaignId}: ${totalCreated} tasks, ${pendingTasks.length} queued to ${onlineDevices.length} device(s)`,
    );
  }

  private async requeuePendingTasks(campaignId: string, campaign: any) {
    // Reset QUEUED tasks back to PENDING
    await this.prisma.taskLog.updateMany({
      where: { campaignId, status: TaskStatus.QUEUED },
      data: { status: TaskStatus.PENDING },
    });

    // Queue one task per online device
    const onlineDevices = await this.prisma.device.findMany({
      where: { id: { in: campaign.deviceIds }, isOnline: true },
      select: { id: true },
    });

    const pendingTasks = await this.prisma.taskLog.findMany({
      where: { campaignId, status: TaskStatus.PENDING },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: Math.max(onlineDevices.length, 1),
    });

    const queue = campaign.type === CampaignType.CALL ? this.callQueue : this.smsQueue;

    for (let i = 0; i < pendingTasks.length; i++) {
      await queue.add(
        { taskId: pendingTasks[i].id, campaignId },
        { delay: i * 100, attempts: 3, removeOnComplete: true },
      );
      await this.prisma.taskLog.update({
        where: { id: pendingTasks[i].id },
        data: { status: TaskStatus.QUEUED },
      });
    }

    this.logger.log(`Re-queued ${pendingTasks.length} tasks for campaign ${campaignId}`);
  }

  async processTask(taskId: string, campaignId: string): Promise<void> {
    const task = await this.prisma.taskLog.findUnique({
      where: { id: taskId },
      include: {
        campaign: true,
        contact: true,
      },
    });

    if (!task) {
      this.logger.warn(`Task ${taskId} not found, skipping`);
      return;
    }

    if (task.campaign.status !== 'RUNNING') {
      this.logger.log(`Campaign ${campaignId} not running, skipping task ${taskId}`);
      return;
    }

    if (task.status !== TaskStatus.QUEUED) {
      return;
    }

    // Find available device and sim
    const assignment = await this.findAvailableDevice(task.campaign);

    if (!assignment) {
      this.logger.warn(`No available device for task ${taskId}, re-queuing in 5s`);
      const queue = task.type === CampaignType.SMS ? this.smsQueue : this.callQueue;
      await queue.add(
        { taskId, campaignId },
        { delay: 5000, attempts: 3, removeOnComplete: true },
      );
      return;
    }

    // Update task with assigned device
    await this.prisma.taskLog.update({
      where: { id: taskId },
      data: {
        deviceId: assignment.deviceId,
        simSlot: assignment.simSlot,
        status: TaskStatus.SENT_TO_DEVICE,
        attempts: { increment: 1 },
      },
    });

    // Build voice file download URL for call campaigns
    let voiceFileUrl: string | null = null;
    if (task.type === CampaignType.CALL && task.campaign.voiceMessageId) {
      voiceFileUrl = `/api/voice-download/${task.campaign.voiceMessageId}`;
    }

    // Send to device via WebSocket
    const taskPayload = {
      taskId,
      type: task.type,
      phoneNumber: task.phoneNumber,
      messageBody: task.messageBody,
      simSlot: assignment.simSlot,
      voiceMessageId: task.campaign.voiceMessageId,
      voiceFileUrl,
    };

    const sent = await this.deviceGateway.sendTask(assignment.deviceId, taskPayload);

    if (!sent) {
      await this.prisma.taskLog.update({
        where: { id: taskId },
        data: { status: TaskStatus.QUEUED, deviceId: null, simSlot: null },
      });
      const queue = task.type === CampaignType.SMS ? this.smsQueue : this.callQueue;
      await queue.add(
        { taskId, campaignId },
        { delay: 5000, attempts: 3, removeOnComplete: true },
      );
    }
  }

  async handleTaskResult(
    taskId: string,
    result: {
      status: TaskStatus;
      errorMessage?: string;
      callDuration?: number;
      callAnswered?: boolean;
    },
  ): Promise<void> {
    const task = await this.prisma.taskLog.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      this.logger.warn(`Task ${taskId} not found for result update`);
      return;
    }

    const updateData: any = { status: result.status };

    if (result.status === TaskStatus.SENT || result.status === TaskStatus.DELIVERED) {
      updateData.sentAt = new Date();
      if (result.status === TaskStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
      }
    }

    if (result.status === TaskStatus.FAILED) {
      updateData.failedAt = new Date();
      updateData.errorMessage = result.errorMessage ?? 'Unknown error';
    }

    if (result.callDuration !== undefined) updateData.callDuration = result.callDuration;
    if (result.callAnswered !== undefined) updateData.callAnswered = result.callAnswered;

    await this.prisma.taskLog.update({
      where: { id: taskId },
      data: updateData,
    });

    // Update campaign stats
    const stats = await this.getCampaignQuickStats(task.campaignId);
    await this.prisma.campaign.update({
      where: { id: task.campaignId },
      data: {
        sentCount: stats.sent + stats.delivered,
        deliveredCount: stats.delivered,
        failedCount: stats.failed,
      },
    });

    // Check if campaign is complete
    const totalProcessed = stats.sent + stats.delivered + stats.failed + stats.cancelled;
    if (totalProcessed >= stats.total && stats.total > 0) {
      await this.prisma.campaign.update({
        where: { id: task.campaignId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    } else {
      // Queue next PENDING task for this campaign (SemySMS-style: one at a time per device)
      const campaign = await this.prisma.campaign.findUnique({ where: { id: task.campaignId } });
      if (campaign && campaign.status === 'RUNNING') {
        const nextTask = await this.prisma.taskLog.findFirst({
          where: { campaignId: task.campaignId, status: TaskStatus.PENDING },
          orderBy: { createdAt: 'asc' },
        });
        if (nextTask) {
          const queue = task.type === CampaignType.CALL ? this.callQueue : this.smsQueue;
          const delay = task.type === CampaignType.CALL ? 3000 : 100; // SMS: deyarli darhol, CALL: 3s pauza
          await queue.add(
            { taskId: nextTask.id, campaignId: task.campaignId },
            { delay, attempts: 3, removeOnComplete: true },
          );
          await this.prisma.taskLog.update({
            where: { id: nextTask.id },
            data: { status: TaskStatus.QUEUED },
          });
        }
      }
    }

    // Broadcast progress to dashboard
    this.dashboardGateway.broadcastCampaignProgress(task.campaignId, stats);
    this.dashboardGateway.broadcastTaskUpdate({
      taskId,
      campaignId: task.campaignId,
      status: result.status,
      phoneNumber: task.phoneNumber,
    });
  }

  async retryFailedTask(taskId: string): Promise<void> {
    const task = await this.prisma.taskLog.findUnique({ where: { id: taskId } });

    if (!task || task.status !== TaskStatus.FAILED) return;
    if (task.attempts >= task.maxAttempts) {
      this.logger.warn(`Task ${taskId} exceeded max attempts (${task.maxAttempts})`);
      return;
    }

    await this.prisma.taskLog.update({
      where: { id: taskId },
      data: { status: TaskStatus.QUEUED, errorMessage: null, failedAt: null, deviceId: null, simSlot: null },
    });

    const queue = task.type === CampaignType.SMS ? this.smsQueue : this.callQueue;
    await queue.add(
      { taskId, campaignId: task.campaignId },
      { delay: 3000, attempts: 1, removeOnComplete: true },
    );
  }

  /**
   * Qurilma qayta ulanganda chaqiriladi - to'xtab qolgan tasklarni qayta queue qilish
   */
  async requeueStuckTasks(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.status !== 'RUNNING') return;

    // Bir vaqtda bitta task yuboriladigan qilib - birinchisini queue ga qo'yamiz
    const firstPending = await this.prisma.taskLog.findFirst({
      where: { campaignId, status: TaskStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    if (firstPending) {
      const queue = campaign.type === 'CALL' ? this.callQueue : this.smsQueue;
      await queue.add(
        { taskId: firstPending.id, campaignId },
        { delay: 2000, attempts: 3, removeOnComplete: true },
      );
      await this.prisma.taskLog.update({
        where: { id: firstPending.id },
        data: { status: TaskStatus.QUEUED },
      });
      this.logger.log(`Requeued stuck task ${firstPending.id} for campaign ${campaignId}`);
    }
  }

  async cancelCampaignTasks(campaignId: string): Promise<void> {
    await this.prisma.taskLog.updateMany({
      where: { campaignId, status: { in: [TaskStatus.PENDING, TaskStatus.QUEUED] } },
      data: { status: TaskStatus.CANCELLED },
    });

    const smsJobs = await this.smsQueue.getJobs(['waiting', 'delayed']);
    const callJobs = await this.callQueue.getJobs(['waiting', 'delayed']);

    for (const job of [...smsJobs, ...callJobs]) {
      if (job.data.campaignId === campaignId) {
        await job.remove();
      }
    }

    this.logger.log(`Cancelled all pending tasks for campaign ${campaignId}`);
  }

  private async findAvailableDevice(campaign: any) {
    const onlineDevices = await this.prisma.device.findMany({
      where: {
        id: { in: campaign.deviceIds },
        isOnline: true,
      },
      include: {
        simCards: {
          where: {
            isActive: true,
            ...(campaign.type === CampaignType.SMS
              ? { smsCapable: true }
              : { callCapable: true }),
          },
        },
      },
    });

    if (onlineDevices.length === 0) return null;

    // Find device+sim with lowest usage (LOAD_BALANCE logic)
    let bestDevice: string | null = null;
    let bestSim: number | null = null;
    let lowestCount = Infinity;

    for (const device of onlineDevices) {
      for (const sim of device.simCards) {
        const count = campaign.type === CampaignType.SMS
          ? sim.dailySmsCount
          : sim.dailyCallCount;
        const limit = campaign.type === CampaignType.SMS
          ? sim.dailyLimitSms
          : sim.dailyLimitCall;

        if (count >= limit) continue;

        // Apply SIM strategy filter
        if (campaign.simStrategy === 'SIM_1_ONLY' && sim.slotIndex !== 0) continue;
        if (campaign.simStrategy === 'SIM_2_ONLY' && sim.slotIndex !== 1) continue;

        if (count < lowestCount) {
          lowestCount = count;
          bestDevice = device.id;
          bestSim = sim.slotIndex;
        }
      }
    }

    if (!bestDevice || bestSim === null) return null;

    // Increment daily counter
    await this.prisma.simCard.updateMany({
      where: {
        deviceId: bestDevice,
        slotIndex: bestSim,
      },
      data: {
        ...(campaign.type === CampaignType.SMS
          ? { dailySmsCount: { increment: 1 } }
          : { dailyCallCount: { increment: 1 } }),
      },
    });

    return { deviceId: bestDevice, simSlot: bestSim };
  }

  private async getCampaignQuickStats(campaignId: string) {
    const [total, stats] = await Promise.all([
      this.prisma.taskLog.count({ where: { campaignId } }),
      this.prisma.taskLog.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: { status: true },
      }),
    ]);

    const statusMap = stats.reduce(
      (acc, s) => { acc[s.status] = s._count.status; return acc; },
      {} as Record<string, number>,
    );

    return {
      total,
      pending: statusMap['PENDING'] ?? 0,
      queued: statusMap['QUEUED'] ?? 0,
      sent: statusMap['SENT'] ?? 0,
      delivered: statusMap['DELIVERED'] ?? 0,
      failed: statusMap['FAILED'] ?? 0,
      cancelled: statusMap['CANCELLED'] ?? 0,
    };
  }
}
