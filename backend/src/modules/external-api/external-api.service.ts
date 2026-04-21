import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TaskStatus, CampaignType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendCallDto } from './dto/send-call.dto';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectQueue('sms-tasks') private readonly smsQueue: Queue,
    @InjectQueue('call-tasks') private readonly callQueue: Queue,
  ) {}

  /**
   * Send an SMS via the external API.
   * Creates a TaskLog and queues it to an available device.
   */
  async sendSms(userId: string, dto: SendSmsDto) {
    // Check usage limits
    const withinLimit = await this.subscriptionsService.checkLimit(userId, 'sms');
    if (!withinLimit) {
      throw new ForbiddenException('Daily SMS limit reached. Upgrade your plan for more.');
    }

    // Find an available device for this user
    const device = await this.findAvailableDevice(userId, 'SMS');
    if (!device) {
      throw new BadRequestException('No available device found. Ensure a device is online.');
    }

    // We need a campaign context - create an "API" campaign or use direct task
    // For external API, we create a standalone task with a dummy campaign reference
    // First, find or create a default contact for the phone number
    const contact = await this.findOrCreateApiContact(userId, dto.to);

    // Find or create a default "API" campaign for this user
    const campaign = await this.findOrCreateApiCampaign(userId, CampaignType.SMS);

    // Create the task log
    const task = await this.prisma.taskLog.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        deviceId: device.deviceId,
        simSlot: device.simSlot,
        type: CampaignType.SMS,
        phoneNumber: dto.to,
        messageBody: dto.message,
        status: TaskStatus.QUEUED,
        attempts: 0,
        maxAttempts: 3,
      },
    });

    // Queue the task
    await this.smsQueue.add(
      { taskId: task.id, campaignId: campaign.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true },
    );

    // Increment usage
    await this.subscriptionsService.incrementUsage(userId, 'sms');

    this.logger.log(`API SMS queued: ${task.id} to ${dto.to}`);

    return {
      taskId: task.id,
      status: task.status,
      to: dto.to,
      message: 'SMS queued for sending',
    };
  }

  /**
   * Send a call via the external API.
   */
  async sendCall(userId: string, dto: SendCallDto) {
    // Check usage limits
    const withinLimit = await this.subscriptionsService.checkLimit(userId, 'call');
    if (!withinLimit) {
      throw new ForbiddenException('Daily call limit reached. Upgrade your plan for more.');
    }

    // Verify voice message exists and belongs to user
    const voiceMessage = await this.prisma.voiceMessage.findFirst({
      where: { id: dto.voiceMessageId, userId },
    });

    if (!voiceMessage) {
      throw new NotFoundException('Voice message not found');
    }

    // Find available device
    const device = await this.findAvailableDevice(userId, 'CALL');
    if (!device) {
      throw new BadRequestException('No available device found. Ensure a device is online.');
    }

    const contact = await this.findOrCreateApiContact(userId, dto.to);
    const campaign = await this.findOrCreateApiCampaign(userId, CampaignType.CALL);

    const task = await this.prisma.taskLog.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        deviceId: device.deviceId,
        simSlot: device.simSlot,
        type: CampaignType.CALL,
        phoneNumber: dto.to,
        status: TaskStatus.QUEUED,
        attempts: 0,
        maxAttempts: 3,
      },
    });

    await this.callQueue.add(
      { taskId: task.id, campaignId: campaign.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true },
    );

    await this.subscriptionsService.incrementUsage(userId, 'call');

    this.logger.log(`API Call queued: ${task.id} to ${dto.to}`);

    return {
      taskId: task.id,
      status: task.status,
      to: dto.to,
      message: 'Call queued for sending',
    };
  }

  /**
   * Get the status of a task.
   */
  async getTaskStatus(userId: string, taskId: string) {
    const task = await this.prisma.taskLog.findUnique({
      where: { id: taskId },
      include: {
        campaign: { select: { userId: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.campaign.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      taskId: task.id,
      type: task.type,
      phoneNumber: task.phoneNumber,
      status: task.status,
      errorMessage: task.errorMessage,
      attempts: task.attempts,
      sentAt: task.sentAt,
      deliveredAt: task.deliveredAt,
      failedAt: task.failedAt,
      callDuration: task.callDuration,
      callAnswered: task.callAnswered,
      createdAt: task.createdAt,
    };
  }

  /**
   * Get user's usage vs limits (balance).
   */
  async getBalance(userId: string) {
    return this.subscriptionsService.getUsage(userId);
  }

  /**
   * Find an available online device + sim for the user.
   */
  private async findAvailableDevice(userId: string, type: 'SMS' | 'CALL') {
    const devices = await this.prisma.device.findMany({
      where: { userId, isOnline: true },
      include: {
        simCards: {
          where: {
            isActive: true,
            ...(type === 'SMS' ? { smsCapable: true } : { callCapable: true }),
          },
        },
      },
    });

    for (const device of devices) {
      for (const sim of device.simCards) {
        const count = type === 'SMS' ? sim.dailySmsCount : sim.dailyCallCount;
        const limit = type === 'SMS' ? sim.dailyLimitSms : sim.dailyLimitCall;
        if (count < limit) {
          return { deviceId: device.id, simSlot: sim.slotIndex };
        }
      }
    }

    return null;
  }

  /**
   * Find or create a contact for API-originated messages.
   */
  private async findOrCreateApiContact(userId: string, phoneNumber: string) {
    // Find or create an "API Contacts" group for this user
    let group = await this.prisma.contactGroup.findFirst({
      where: { userId, name: 'API Contacts' },
    });

    if (!group) {
      group = await this.prisma.contactGroup.create({
        data: { name: 'API Contacts', userId, description: 'Auto-created for API usage' },
      });
    }

    // Find existing contact in this group
    let contact = await this.prisma.contact.findFirst({
      where: { groupId: group.id, phoneNumber },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: { phoneNumber, groupId: group.id },
      });

      // Update contact count
      await this.prisma.contactGroup.update({
        where: { id: group.id },
        data: { contactCount: { increment: 1 } },
      });
    }

    return contact;
  }

  /**
   * Find or create a default "API" campaign for external API tasks.
   */
  private async findOrCreateApiCampaign(userId: string, type: CampaignType) {
    const campaignName = `API ${type} Campaign`;

    // Online qurilmalarni har safar yangilanadigan qilib topamiz
    const onlineDevices = await this.prisma.device.findMany({
      where: { userId, isOnline: true, isBlocked: false },
      select: { id: true },
    });
    const deviceIds = onlineDevices.map((d) => d.id);

    let campaign = await this.prisma.campaign.findFirst({
      where: {
        userId,
        name: campaignName,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!campaign) {
      // Contact group yaratamiz
      let group = await this.prisma.contactGroup.findFirst({
        where: { userId, name: 'API Contacts' },
      });

      if (!group) {
        group = await this.prisma.contactGroup.create({
          data: { name: 'API Contacts', userId, description: 'Auto-created for API usage' },
        });
      }

      campaign = await this.prisma.campaign.create({
        data: {
          name: campaignName,
          type,
          status: 'RUNNING',
          userId,
          contactGroupId: group.id,
          deviceIds,
        },
      });
    } else {
      // Mavjud kampaniyani RUNNING qilib yangi online qurilmalar bilan yangilaymiz
      campaign = await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'RUNNING',
          deviceIds,
        },
      });
    }

    return campaign;
  }
}
