import { SubscriptionPlan } from '@prisma/client';

export interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  maxDevices: number;
  maxSmsPerDay: number;
  maxCallsPerDay: number;
  price: number;
}

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    plan: SubscriptionPlan.FREE,
    name: 'Bepul',
    maxDevices: 1,
    maxSmsPerDay: 100,
    maxCallsPerDay: 50,
    price: 0,
  },
  [SubscriptionPlan.PRO]: {
    plan: SubscriptionPlan.PRO,
    name: 'Pro',
    maxDevices: 10,
    maxSmsPerDay: 10000,
    maxCallsPerDay: 5000,
    price: 99000,
  },
  [SubscriptionPlan.BUSINESS]: {
    plan: SubscriptionPlan.BUSINESS,
    name: 'Biznes',
    maxDevices: -1,
    maxSmsPerDay: -1,
    maxCallsPerDay: -1,
    price: 299000,
  },
};
