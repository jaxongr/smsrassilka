import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PLANS, PlanConfig } from './plans.config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current subscription for a user.
   */
  async getCurrentPlan(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Auto-create FREE subscription if missing
      const freePlan = PLANS[SubscriptionPlan.FREE];
      const created = await this.prisma.subscription.create({
        data: {
          userId,
          plan: SubscriptionPlan.FREE,
          maxDevices: freePlan.maxDevices,
          maxSmsPerDay: freePlan.maxSmsPerDay,
          maxCallsPerDay: freePlan.maxCallsPerDay,
        },
      });
      return {
        ...created,
        planDetails: freePlan,
      };
    }

    return {
      ...subscription,
      planDetails: PLANS[subscription.plan],
    };
  }

  /**
   * Get all available plans.
   */
  getPlans(): PlanConfig[] {
    return Object.values(PLANS);
  }

  /**
   * Upgrade a user's subscription plan.
   */
  async upgradePlan(userId: string, plan: SubscriptionPlan) {
    const planConfig = PLANS[plan];
    if (!planConfig) {
      throw new BadRequestException('Invalid plan');
    }

    const current = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!current) {
      throw new NotFoundException('Subscription not found');
    }

    // Prevent downgrade to same plan
    const planOrder = { FREE: 0, PRO: 1, BUSINESS: 2 };
    if (planOrder[plan] <= planOrder[current.plan]) {
      throw new BadRequestException(
        'Cannot downgrade or select the same plan. Current plan: ' + current.plan,
      );
    }

    const updated = await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        maxDevices: planConfig.maxDevices,
        maxSmsPerDay: planConfig.maxSmsPerDay,
        maxCallsPerDay: planConfig.maxCallsPerDay,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    this.logger.log(`User ${userId} upgraded to ${plan}`);

    return {
      ...updated,
      planDetails: planConfig,
    };
  }

  /**
   * Get current usage for today.
   */
  async getUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usage = await this.prisma.usageLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!usage) {
      usage = await this.prisma.usageLog.create({
        data: {
          userId,
          date: today,
          smsCount: 0,
          callCount: 0,
          apiCalls: 0,
        },
      });
    }

    const subscription = await this.getCurrentPlan(userId);

    return {
      usage,
      limits: {
        maxSmsPerDay: subscription.maxSmsPerDay,
        maxCallsPerDay: subscription.maxCallsPerDay,
        maxDevices: subscription.maxDevices,
      },
      remaining: {
        sms: subscription.maxSmsPerDay === -1
          ? -1
          : Math.max(0, subscription.maxSmsPerDay - usage.smsCount),
        calls: subscription.maxCallsPerDay === -1
          ? -1
          : Math.max(0, subscription.maxCallsPerDay - usage.callCount),
      },
    };
  }

  /**
   * Check if user is within their daily limit for a given type.
   */
  async checkLimit(userId: string, type: 'sms' | 'call'): Promise<boolean> {
    const { remaining } = await this.getUsage(userId);

    if (type === 'sms') {
      return remaining.sms === -1 || remaining.sms > 0;
    }
    return remaining.calls === -1 || remaining.calls > 0;
  }

  /**
   * Increment usage counter.
   */
  async incrementUsage(userId: string, type: 'sms' | 'call') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.usageLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        smsCount: type === 'sms' ? 1 : 0,
        callCount: type === 'call' ? 1 : 0,
        apiCalls: 1,
      },
      update: {
        ...(type === 'sms' ? { smsCount: { increment: 1 } } : {}),
        ...(type === 'call' ? { callCount: { increment: 1 } } : {}),
        apiCalls: { increment: 1 },
      },
    });
  }
}
