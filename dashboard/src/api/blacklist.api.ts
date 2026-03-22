import api from './axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';

export interface BlacklistEntry {
  id: string;
  phoneNumber: string;
  reason: string | null;
  createdAt: string;
}

export const blacklistApi = {
  getBlacklist: (params?: PaginationParams) =>
    api.get<PaginatedResponse<BlacklistEntry>>('/blacklist', { params }),

  addToBlacklist: (phoneNumber: string, reason?: string) =>
    api.post<ApiResponse<BlacklistEntry>>('/blacklist', { phoneNumber, reason }),

  removeFromBlacklist: (id: string) =>
    api.delete<ApiResponse<void>>(`/blacklist/${id}`),

  importBlacklist: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imported: number }>>('/blacklist/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
