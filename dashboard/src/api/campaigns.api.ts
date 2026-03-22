import api from './axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Campaign, TaskLog } from '@/types/campaign.types';

export interface CreateCampaignData {
  name: string;
  type: string;
  message?: string;
  voiceMessageId?: string;
  contactGroupId: string;
  deviceIds: string[];
  simStrategy: string;
  intervalMs?: number;
  dailyLimit?: number;
  scheduledAt?: string;
}

export const campaignsApi = {
  getCampaigns: (params?: PaginationParams & { status?: string }) =>
    api.get<PaginatedResponse<Campaign>>('/campaigns', { params }),

  createCampaign: (data: CreateCampaignData) =>
    api.post<ApiResponse<Campaign>>('/campaigns', data),

  getCampaign: (id: string) =>
    api.get<ApiResponse<Campaign>>(`/campaigns/${id}`),

  updateCampaign: (id: string, data: Partial<CreateCampaignData>) =>
    api.patch<ApiResponse<Campaign>>(`/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    api.delete<ApiResponse<void>>(`/campaigns/${id}`),

  startCampaign: (id: string) =>
    api.post<ApiResponse<void>>(`/campaigns/${id}/start`),

  pauseCampaign: (id: string) =>
    api.post<ApiResponse<void>>(`/campaigns/${id}/pause`),

  resumeCampaign: (id: string) =>
    api.post<ApiResponse<void>>(`/campaigns/${id}/resume`),

  cancelCampaign: (id: string) =>
    api.post<ApiResponse<void>>(`/campaigns/${id}/cancel`),

  getCampaignStats: (id: string) =>
    api.get<ApiResponse<Campaign>>(`/campaigns/${id}/stats`),

  getCampaignLogs: (id: string, params?: PaginationParams & { status?: string }) =>
    api.get<PaginatedResponse<TaskLog>>(`/campaigns/${id}/logs`, { params }),
};
