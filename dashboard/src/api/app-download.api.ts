import api from './axios';

export interface AppInfo {
  version: string;
  fileName: string;
  fileSize: number;
  updatedAt: string | null;
}

export const appDownloadApi = {
  getAppInfo: () => api.get<{ data: AppInfo }>('/app/info'),

  uploadApp: (file: File, version: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    return api.post('/app/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getDownloadUrl: () => '/api/app/download',
};
