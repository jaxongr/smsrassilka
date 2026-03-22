import api from './axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { User } from '@/types/user.types';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}

export const usersApi = {
  getUsers: (params?: PaginationParams) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getUser: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  createUser: (data: CreateUserData) =>
    api.post<ApiResponse<User>>('/users', data),

  updateUser: (id: string, data: UpdateUserData) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete<ApiResponse<void>>(`/users/${id}`),
};
