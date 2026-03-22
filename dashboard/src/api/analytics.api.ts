import api from './axios';
import type { ApiResponse } from '@/types/api.types';
import type { DashboardStats, DailyUsage, DeliveryReport } from '@/types/analytics.types';

export const analyticsApi = {
  getDashboardStats: () =>
    api.get<ApiResponse<DashboardStats>>('/analytics/dashboard'),

  getCampaignAnalytics: (from: string, to: string) =>
    api.get<ApiResponse<DailyUsage[]>>('/analytics/campaigns', {
      params: { from, to },
    }),

  getDeviceAnalytics: () =>
    api.get<ApiResponse<Record<string, unknown>>>('/analytics/devices'),

  getDailyUsage: (days: number = 30) =>
    api.get<ApiResponse<DailyUsage[]>>('/analytics/daily-usage', {
      params: { days },
    }),

  getDeliveryReport: (campaignId: string) =>
    api.get<ApiResponse<DeliveryReport>>(`/analytics/campaigns/${campaignId}/report`),
};
