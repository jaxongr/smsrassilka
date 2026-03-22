import api from './axios';
import type { ApiResponse } from '@/types/api.types';
import type { User } from '@/types/user.types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),

  register: (email: string, password: string, fullName: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', {
      email,
      password,
      fullName,
    }),

  refreshToken: (token: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken: token,
    }),

  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
};
