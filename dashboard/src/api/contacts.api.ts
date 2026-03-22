import api from './axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { ContactGroup, Contact } from '@/types/contact.types';

export const contactsApi = {
  getGroups: () =>
    api.get<ApiResponse<ContactGroup[]>>('/contact-groups'),

  createGroup: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<ContactGroup>>('/contact-groups', data),

  getGroup: (id: string) =>
    api.get<ApiResponse<ContactGroup>>(`/contact-groups/${id}`),

  updateGroup: (id: string, data: { name?: string; description?: string }) =>
    api.patch<ApiResponse<ContactGroup>>(`/contact-groups/${id}`, data),

  deleteGroup: (id: string) =>
    api.delete<ApiResponse<void>>(`/contact-groups/${id}`),

  getGroupContacts: (id: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Contact>>(`/contact-groups/${id}/contacts`, {
      params,
    }),

  addContact: (
    groupId: string,
    data: {
      phoneNumber: string;
      firstName?: string;
      lastName?: string;
      variables?: Record<string, string>;
    },
  ) =>
    api.post<ApiResponse<Contact>>(`/contact-groups/${groupId}/contacts`, data),

  importContacts: (groupId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imported: number; duplicates: number }>>(
      `/contact-groups/${groupId}/import`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  deleteContact: (id: string) =>
    api.delete<ApiResponse<void>>(`/contacts/${id}`),
};
