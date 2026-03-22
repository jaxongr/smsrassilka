import api from './axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { InboxMessage } from '@/types/inbox.types';

export const inboxApi = {
  getInbox: (params?: PaginationParams & { isRead?: boolean }) =>
    api.get<PaginatedResponse<InboxMessage>>('/inbox', { params }),

  getInboxMessage: (id: string) =>
    api.get<ApiResponse<InboxMessage>>(`/inbox/${id}`),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<void>>(`/inbox/${id}/read`),

  markAllAsRead: () =>
    api.post<ApiResponse<void>>('/inbox/mark-all-read'),

  replyToMessage: (
    id: string,
    body: string,
    deviceId?: string,
    simSlot?: number,
  ) =>
    api.post<ApiResponse<void>>(`/inbox/${id}/reply`, {
      body,
      deviceId,
      simSlot,
    }),

  getConversation: (phoneNumber: string) =>
    api.get<ApiResponse<InboxMessage[]>>(`/inbox/conversation/${encodeURIComponent(phoneNumber)}`),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/inbox/unread-count'),
};
