import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DeviceGateway } from '../gateway/device.gateway';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceGateway: DeviceGateway,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { isRead?: boolean; fromNumber?: string },
  ) {
    const where: any = {};

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.fromNumber) {
      where.fromNumber = { contains: filters.fromNumber };
    }

    const [data, total] = await Promise.all([
      this.prisma.inboxMessage.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { receivedAt: 'desc' },
        include: {
          replies: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.inboxMessage.count({ where }),
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
    const message = await this.prisma.inboxMessage.findUnique({
      where: { id },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!message) {
      throw new NotFoundException('Inbox message not found');
    }

    return message;
  }

  async markAsRead(id: string) {
    const message = await this.findOne(id);

    return this.prisma.inboxMessage.update({
      where: { id: message.id },
      data: { isRead: true },
    });
  }

  async markAllAsRead() {
    const result = await this.prisma.inboxMessage.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  async reply(
    id: string,
    body: string,
    deviceId?: string,
    simSlot?: number,
  ) {
    const message = await this.findOne(id);

    // Create the reply record
    const reply = await this.prisma.inboxReply.create({
      data: {
        inboxMessageId: id,
        body,
        deviceId: deviceId ?? message.deviceId,
        simSlot: simSlot ?? message.simSlot,
        status: TaskStatus.PENDING,
      },
    });

    // Update the inbox message
    await this.prisma.inboxMessage.update({
      where: { id },
      data: {
        repliedAt: new Date(),
        replyBody: body,
        isRead: true,
      },
    });

    // Send via device gateway
    const targetDeviceId = deviceId ?? message.deviceId;
    const targetSimSlot = simSlot ?? message.simSlot ?? 0;

    const task = {
      taskId: reply.id,
      type: 'SMS',
      phoneNumber: message.fromNumber,
      messageBody: body,
      simSlot: targetSimSlot,
      isReply: true,
    };

    const sent = await this.deviceGateway.sendTask(targetDeviceId, task);

    if (sent) {
      await this.prisma.inboxReply.update({
        where: { id: reply.id },
        data: { status: TaskStatus.SENT_TO_DEVICE },
      });
    }

    this.logger.log(`Reply sent to ${message.fromNumber} via device ${targetDeviceId}`);

    return reply;
  }

  async getConversation(phoneNumber: string) {
    const messages = await this.prisma.inboxMessage.findMany({
      where: { fromNumber: phoneNumber },
      orderBy: { receivedAt: 'asc' },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Build a conversation thread
    const conversation: Array<{
      id: string;
      direction: 'incoming' | 'outgoing';
      body: string;
      timestamp: Date;
      status?: string;
    }> = [];

    for (const msg of messages) {
      conversation.push({
        id: msg.id,
        direction: 'incoming',
        body: msg.body,
        timestamp: msg.receivedAt,
      });

      for (const reply of msg.replies) {
        conversation.push({
          id: reply.id,
          direction: 'outgoing',
          body: reply.body,
          timestamp: reply.createdAt,
          status: reply.status,
        });
      }
    }

    // Sort by timestamp
    conversation.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      phoneNumber,
      totalMessages: conversation.length,
      messages: conversation,
    };
  }

  async getUnreadCount() {
    const count = await this.prisma.inboxMessage.count({
      where: { isRead: false },
    });

    return { unreadCount: count };
  }
}
