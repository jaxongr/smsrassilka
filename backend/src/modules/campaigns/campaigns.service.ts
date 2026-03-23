import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TaskQueueService } from '../task-queue/task-queue.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskQueueService: TaskQueueService,
  ) {}

  async findAll(userId: string, pagination: PaginationDto) {
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          contactGroup: { select: { id: true, name: true, contactCount: true } },
          voiceMessage: { select: { id: true, name: true, duration: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.take),
      },
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        contactGroup: { select: { id: true, name: true, contactCount: true } },
        voiceMessage: { select: { id: true, name: true, duration: true, filePath: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async create(userId: string, dto: CreateCampaignDto) {
    // Validate contact group exists
    const contactGroup = await this.prisma.contactGroup.findUnique({
      where: { id: dto.contactGroupId },
    });
    if (!contactGroup) {
      throw new BadRequestException('Contact group not found');
    }

    // Validate devices exist and belong to user
    const devices = await this.prisma.device.findMany({
      where: { id: { in: dto.deviceIds }, userId },
    });
    if (devices.length !== dto.deviceIds.length) {
      throw new BadRequestException('One or more devices not found or do not belong to you');
    }

    // Validate voice message for CALL type
    if (dto.type === 'CALL' && !dto.voiceMessageId) {
      throw new BadRequestException('Voice message is required for CALL campaigns');
    }

    if (dto.type === 'SMS' && !dto.messageTemplate) {
      throw new BadRequestException('Message template is required for SMS campaigns');
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        type: dto.type,
        messageTemplate: dto.messageTemplate,
        voiceMessageId: dto.voiceMessageId,
        contactGroupId: dto.contactGroupId,
        deviceIds: dto.deviceIds,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        intervalMs: dto.intervalMs ?? 3000,
        simStrategy: dto.simStrategy ?? 'ROUND_ROBIN',
        userId,
        totalCount: contactGroup.contactCount,
      },
      include: {
        contactGroup: { select: { id: true, name: true, contactCount: true } },
      },
    });

    this.logger.log(`Campaign created: ${campaign.id} by user ${userId}`);
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);

    if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.CANCELLED) {
      throw new BadRequestException('Tugallangan yoki bekor qilingan kampaniyani tahrirlash mumkin emas');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.messageTemplate !== undefined && { messageTemplate: dto.messageTemplate }),
        ...(dto.voiceMessageId !== undefined && { voiceMessageId: dto.voiceMessageId }),
        ...(dto.contactGroupId && { contactGroupId: dto.contactGroupId }),
        ...(dto.deviceIds && { deviceIds: dto.deviceIds }),
        ...(dto.scheduledAt !== undefined && {
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }),
        ...(dto.intervalMs && { intervalMs: dto.intervalMs }),
        ...(dto.simStrategy && { simStrategy: dto.simStrategy }),
      },
    });
  }

  async remove(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Can only delete campaigns in DRAFT status');
    }

    await this.prisma.campaign.delete({ where: { id } });
    this.logger.log(`Campaign deleted: ${id}`);
    return { message: 'Campaign deleted successfully' };
  }

  async start(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Can only start campaigns in DRAFT or SCHEDULED status');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    // Emit tasks to queue
    await this.taskQueueService.initCampaign(id);

    this.logger.log(`Campaign started: ${id}`);
    return updated;
  }

  async pause(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Can only pause RUNNING campaigns');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });

    this.logger.log(`Campaign paused: ${id}`);
    return updated;
  }

  async resume(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('Can only resume PAUSED campaigns');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.RUNNING },
    });

    // Re-emit pending tasks
    await this.taskQueueService.initCampaign(id);

    this.logger.log(`Campaign resumed: ${id}`);
    return updated;
  }

  async cancel(id: string) {
    const campaign = await this.findOne(id);

    if (
      campaign.status !== CampaignStatus.RUNNING &&
      campaign.status !== CampaignStatus.PAUSED &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException('Can only cancel RUNNING, PAUSED, or SCHEDULED campaigns');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    // Cancel pending tasks
    await this.taskQueueService.cancelCampaignTasks(id);

    this.logger.log(`Campaign cancelled: ${id}`);
    return updated;
  }

  async getStats(id: string) {
    const campaign = await this.findOne(id);

    const stats = await this.prisma.taskLog.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { status: true },
    });

    const statusMap = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const total = campaign.totalCount;
    const sent = statusMap['SENT'] ?? 0;
    const delivered = statusMap['DELIVERED'] ?? 0;
    const failed = statusMap['FAILED'] ?? 0;
    const pending = statusMap['PENDING'] ?? 0;
    const queued = statusMap['QUEUED'] ?? 0;
    const sentToDevice = statusMap['SENT_TO_DEVICE'] ?? 0;
    const cancelled = statusMap['CANCELLED'] ?? 0;

    const processed = sent + delivered + failed;
    const deliveryRate = processed > 0 ? ((delivered / processed) * 100).toFixed(2) : '0.00';
    const progress = total > 0 ? (((processed + cancelled) / total) * 100).toFixed(2) : '0.00';

    return {
      campaignId: id,
      campaignName: campaign.name,
      status: campaign.status,
      total,
      pending,
      queued,
      sentToDevice,
      sent,
      delivered,
      failed,
      cancelled,
      processed,
      deliveryRate: parseFloat(deliveryRate),
      progress: parseFloat(progress),
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    };
  }

  async getLogs(id: string, pagination: PaginationDto) {
    await this.findOne(id); // validate campaign exists

    const where = { campaignId: id };

    const [data, total] = await Promise.all([
      this.prisma.taskLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, phoneNumber: true, firstName: true, lastName: true } },
          device: { select: { id: true, name: true } },
        },
      }),
      this.prisma.taskLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.take),
      },
    };
  }

  async updateStats(id: string) {
    const stats = await this.prisma.taskLog.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { status: true },
    });

    const statusMap = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sentCount = (statusMap['SENT'] ?? 0) + (statusMap['DELIVERED'] ?? 0);
    const deliveredCount = statusMap['DELIVERED'] ?? 0;
    const failedCount = statusMap['FAILED'] ?? 0;

    const totalTasks = await this.prisma.taskLog.count({ where: { campaignId: id } });
    const completedTasks = sentCount + failedCount + (statusMap['CANCELLED'] ?? 0);

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        sentCount,
        deliveredCount,
        failedCount,
        ...(completedTasks >= totalTasks && totalTasks > 0
          ? {
              status: CampaignStatus.COMPLETED,
              completedAt: new Date(),
            }
          : {}),
      },
    });

    return updated;
  }
}
