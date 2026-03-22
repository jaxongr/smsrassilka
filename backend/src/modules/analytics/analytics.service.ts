import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getDashboardStats(userId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      smsSentToday,
      smsSentMonth,
      callsToday,
      callsMonth,
      activeCampaigns,
      totalCampaigns,
      onlineDevices,
      totalDevices,
      totalContacts,
      totalSmsSent,
      totalSmsDelivered,
      totalSmsFailed,
      blacklistCount,
      unreadInbox,
    ] = await Promise.all([
      this.prisma.taskLog.count({
        where: { campaign: { userId }, type: 'SMS', status: { in: ['SENT', 'DELIVERED'] }, sentAt: { gte: todayStart } },
      }),
      this.prisma.taskLog.count({
        where: { campaign: { userId }, type: 'SMS', status: { in: ['SENT', 'DELIVERED'] }, sentAt: { gte: monthStart } },
      }),
      this.prisma.taskLog.count({
        where: { campaign: { userId }, type: 'CALL', status: { in: ['SENT', 'DELIVERED'] }, sentAt: { gte: todayStart } },
      }),
      this.prisma.taskLog.count({
        where: { campaign: { userId }, type: 'CALL', status: { in: ['SENT', 'DELIVERED'] }, sentAt: { gte: monthStart } },
      }),
      this.prisma.campaign.count({ where: { userId, status: 'RUNNING' } }),
      this.prisma.campaign.count({ where: { userId } }),
      this.prisma.device.count({ where: { userId, isOnline: true } }),
      this.prisma.device.count({ where: { userId } }),
      this.prisma.contact.count({ where: { group: { userId } } }),
      this.prisma.taskLog.count({ where: { campaign: { userId }, status: { in: ['SENT', 'DELIVERED'] } } }),
      this.prisma.taskLog.count({ where: { campaign: { userId }, status: 'DELIVERED' } }),
      this.prisma.taskLog.count({ where: { campaign: { userId }, status: 'FAILED' } }),
      this.prisma.blacklist.count({ where: { userId } }),
      this.prisma.inboxMessage.count({ where: { isRead: false } }),
    ]);

    const deliveryRate = totalSmsSent > 0 ? ((totalSmsDelivered / totalSmsSent) * 100) : 0;

    return {
      smsSentToday,
      smsSentMonth,
      callsToday,
      callsMonth,
      activeCampaigns,
      totalCampaigns,
      onlineDevices,
      totalDevices,
      totalContacts,
      totalSmsSent,
      totalSmsDelivered,
      totalSmsFailed,
      blacklistCount,
      unreadInbox,
      deliveryRate: parseFloat(deliveryRate.toFixed(1)),
    };
  }

  async getCampaignAnalytics(userId: string, dateFrom?: string, dateTo?: string) {
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    // Get campaigns in date range
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        totalCount: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by day for chart data
    const dailyData: Record<
      string,
      { date: string; sms: number; calls: number; delivered: number; failed: number }
    > = {};

    const taskLogs = await this.prisma.taskLog.findMany({
      where: {
        campaign: { userId },
        sentAt: { gte: fromDate, lte: toDate },
        status: { in: ['SENT', 'DELIVERED', 'FAILED'] },
      },
      select: {
        type: true,
        status: true,
        sentAt: true,
      },
    });

    for (const log of taskLogs) {
      if (!log.sentAt) continue;
      const dateKey = log.sentAt.toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, sms: 0, calls: 0, delivered: 0, failed: 0 };
      }

      if (log.type === 'SMS') dailyData[dateKey].sms++;
      if (log.type === 'CALL') dailyData[dateKey].calls++;
      if (log.status === 'DELIVERED') dailyData[dateKey].delivered++;
      if (log.status === 'FAILED') dailyData[dateKey].failed++;
    }

    const daily = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    return { campaigns, daily };
  }

  async getDeviceAnalytics(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      include: {
        simCards: {
          select: {
            id: true,
            slotIndex: true,
            operatorName: true,
            phoneNumber: true,
            isActive: true,
            dailySmsCount: true,
            dailyCallCount: true,
            dailyLimitSms: true,
            dailyLimitCall: true,
          },
        },
        _count: {
          select: { taskLogs: true },
        },
      },
    });

    const deviceStats = await Promise.all(
      devices.map(async (device) => {
        const [sentCount, failedCount] = await Promise.all([
          this.prisma.taskLog.count({
            where: {
              deviceId: device.id,
              status: { in: ['SENT', 'DELIVERED'] },
            },
          }),
          this.prisma.taskLog.count({
            where: {
              deviceId: device.id,
              status: 'FAILED',
            },
          }),
        ]);

        const total = sentCount + failedCount;
        const successRate = total > 0 ? ((sentCount / total) * 100).toFixed(2) : '0.00';

        return {
          id: device.id,
          name: device.name,
          isOnline: device.isOnline,
          lastSeenAt: device.lastSeenAt,
          batteryLevel: device.batteryLevel,
          signalStrength: device.signalStrength,
          simCards: device.simCards,
          totalTasks: device._count.taskLogs,
          sentCount,
          failedCount,
          successRate: parseFloat(successRate),
        };
      }),
    );

    return { devices: deviceStats };
  }

  async getDailyUsage(userId: string, days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const taskLogs = await this.prisma.taskLog.findMany({
      where: {
        campaign: { userId },
        sentAt: { gte: fromDate },
        status: { in: ['SENT', 'DELIVERED'] },
      },
      select: {
        type: true,
        sentAt: true,
      },
    });

    const dailyMap: Record<string, { date: string; sms: number; calls: number }> = {};

    // Pre-fill all days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, sms: 0, calls: 0 };
    }

    for (const log of taskLogs) {
      if (!log.sentAt) continue;
      const dateKey = log.sentAt.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, sms: 0, calls: 0 };
      }
      if (log.type === 'SMS') dailyMap[dateKey].sms++;
      if (log.type === 'CALL') dailyMap[dateKey].calls++;
    }

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDeliveryReport(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        totalCount: true,
      },
    });

    if (!campaign) {
      return null;
    }

    const stats = await this.prisma.taskLog.groupBy({
      by: ['status'],
      where: { campaignId },
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
    const cancelled = statusMap['CANCELLED'] ?? 0;
    const processed = sent + delivered + failed;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
      },
      breakdown: {
        total,
        pending,
        queued,
        sent,
        delivered,
        failed,
        cancelled,
      },
      percentages: {
        deliveredRate: processed > 0 ? parseFloat(((delivered / processed) * 100).toFixed(2)) : 0,
        failedRate: processed > 0 ? parseFloat(((failed / processed) * 100).toFixed(2)) : 0,
        sentRate: processed > 0 ? parseFloat(((sent / processed) * 100).toFixed(2)) : 0,
        completionRate: total > 0 ? parseFloat((((processed + cancelled) / total) * 100).toFixed(2)) : 0,
      },
    };
  }

  async getHourlyDistribution(campaignId: string) {
    const tasks = await this.prisma.taskLog.findMany({
      where: {
        campaignId,
        sentAt: { not: null },
      },
      select: {
        sentAt: true,
        status: true,
      },
    });

    // Initialize 24 hours
    const hourly: Array<{ hour: number; total: number; delivered: number; failed: number }> = [];
    for (let h = 0; h < 24; h++) {
      hourly.push({ hour: h, total: 0, delivered: 0, failed: 0 });
    }

    for (const task of tasks) {
      if (!task.sentAt) continue;
      const hour = task.sentAt.getHours();
      hourly[hour].total++;
      if (task.status === 'DELIVERED') hourly[hour].delivered++;
      if (task.status === 'FAILED') hourly[hour].failed++;
    }

    return { campaignId, hourly };
  }
}
