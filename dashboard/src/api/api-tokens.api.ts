import api from './axios';
import type { ApiResponse } from '@/types/api.types';
import type { ApiToken } from '@/types/api-token.types';

interface CreateTokenResponse {
  token: ApiToken;
  fullToken: string;
}

export const apiTokensApi = {
  getTokens: () =>
    api.get<ApiResponse<ApiToken[]>>('/api-tokens'),

  createToken: (data: { name: string; permissions: string[] }) =>
    api.post<ApiResponse<CreateTokenResponse>>('/api-tokens', data),

  updateToken: (id: string, data: Partial<{ name: string; permissions: string[]; isActive: boolean }>) =>
    api.patch<ApiResponse<ApiToken>>(`/api-tokens/${id}`, data),

  deleteToken: (id: string) =>
    api.delete<ApiResponse<void>>(`/api-tokens/${id}`),
};
