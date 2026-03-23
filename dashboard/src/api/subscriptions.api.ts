import api from './axios';
import type { ApiResponse } from '@/types/api.types';
import type { Subscription, PlanInfo } from '@/types/subscription.types';

export const subscriptionsApi = {
  getCurrentPlan: () =>
    api.get<ApiResponse<Subscription>>('/subscriptions/current'),

  getPlans: () =>
    api.get<ApiResponse<PlanInfo[]>>('/subscriptions/plans'),

  upgradePlan: (plan: string) =>
    api.post<ApiResponse<Subscription>>('/subscriptions/upgrade', { plan }),
};
