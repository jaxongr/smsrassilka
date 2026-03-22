import api from './axios';
import type { ApiResponse } from '@/types/api.types';

export interface VoiceMessage {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  duration: number;
  mimeType: string;
  createdAt: string;
}

export const voiceMessagesApi = {
  getVoiceMessages: () =>
    api.get<ApiResponse<VoiceMessage[]>>('/voice-messages'),

  uploadVoiceMessage: (file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    return api.post<ApiResponse<VoiceMessage>>('/voice-messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteVoiceMessage: (id: string) =>
    api.delete<ApiResponse<void>>(`/voice-messages/${id}`),

  downloadVoiceMessage: (id: string) =>
    api.get<Blob>(`/voice-messages/${id}/download`, {
      responseType: 'blob',
    }),
};
