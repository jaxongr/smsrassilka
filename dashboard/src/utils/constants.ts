import { CampaignStatus, TaskStatus, SimStrategy } from '@/types/campaign.types';

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: '#9CA3AF',
  [CampaignStatus.SCHEDULED]: '#3B82F6',
  [CampaignStatus.RUNNING]: '#6B46C1',
  [CampaignStatus.PAUSED]: '#F59E0B',
  [CampaignStatus.COMPLETED]: '#16A34A',
  [CampaignStatus.CANCELLED]: '#EF4444',
  [CampaignStatus.FAILED]: '#DC2626',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: 'Qoralama',
  [CampaignStatus.SCHEDULED]: 'Rejalashtirilgan',
  [CampaignStatus.RUNNING]: 'Faol',
  [CampaignStatus.PAUSED]: 'To\'xtatilgan',
  [CampaignStatus.COMPLETED]: 'Yakunlangan',
  [CampaignStatus.CANCELLED]: 'Bekor qilingan',
  [CampaignStatus.FAILED]: 'Xatolik',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '#9CA3AF',
  [TaskStatus.QUEUED]: '#3B82F6',
  [TaskStatus.SENDING]: '#6B46C1',
  [TaskStatus.SENT]: '#16A34A',
  [TaskStatus.DELIVERED]: '#059669',
  [TaskStatus.FAILED]: '#EF4444',
  [TaskStatus.REJECTED]: '#DC2626',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Kutilmoqda',
  [TaskStatus.QUEUED]: 'Navbatda',
  [TaskStatus.SENDING]: 'Yuborilmoqda',
  [TaskStatus.SENT]: 'Yuborildi',
  [TaskStatus.DELIVERED]: 'Yetkazildi',
  [TaskStatus.FAILED]: 'Xatolik',
  [TaskStatus.REJECTED]: 'Rad etildi',
};

export const SIM_STRATEGY_LABELS: Record<SimStrategy, string> = {
  [SimStrategy.ROUND_ROBIN]: 'Navbatma-navbat',
  [SimStrategy.SIM_1_ONLY]: 'Faqat SIM 1',
  [SimStrategy.SIM_2_ONLY]: 'Faqat SIM 2',
  [SimStrategy.LOAD_BALANCE]: 'Yukni taqsimlash',
};
