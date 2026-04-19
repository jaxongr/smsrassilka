import api from './axios';
import type { ApiResponse } from '@/types/api.types';
import type { Device } from '@/types/device.types';

export const devicesApi = {
  getDevices: () =>
    api.get<ApiResponse<Device[]>>('/devices'),

  getDevice: (id: string) =>
    api.get<ApiResponse<Device>>(`/devices/${id}`),

  registerDevice: (name: string) =>
    api.post<ApiResponse<Device>>('/devices', { name }),

  updateDevice: (id: string, data: Partial<Pick<Device, 'name'>>) =>
    api.patch<ApiResponse<Device>>(`/devices/${id}`, data),

  deleteDevice: (id: string) =>
    api.delete<ApiResponse<void>>(`/devices/${id}`),

  getOnlineDevices: () =>
    api.get<ApiResponse<Device[]>>('/devices/online'),

  updateSim: (
    deviceId: string,
    slotIndex: number,
    data: { phoneNumber?: string; isActive?: boolean; dailyLimit?: number },
  ) =>
    api.patch<ApiResponse<void>>(
      `/devices/${deviceId}/sims/${slotIndex}`,
      data,
    ),

  // Limit va blok boshqaruvi
  updateLimits: (id: string, data: { smsLimit?: number; callLimit?: number }) =>
    api.patch(`/devices/${id}/limits`, data),

  blockDevice: (id: string) =>
    api.post(`/devices/${id}/block`),

  unblockDevice: (id: string) =>
    api.post(`/devices/${id}/unblock`),

  resetCounters: (id: string) =>
    api.post(`/devices/${id}/reset-counters`),
};
