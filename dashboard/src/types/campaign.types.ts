export enum CampaignType {
  SMS = 'SMS',
  CALL = 'CALL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum SimStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',
  SIM_1_ONLY = 'SIM_1_ONLY',
  SIM_2_ONLY = 'SIM_2_ONLY',
  LOAD_BALANCE = 'LOAD_BALANCE',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  message: string | null;
  voiceMessageId: string | null;
  contactGroupId: string;
  contactGroup?: { name: string; contactCount: number };
  deviceIds: string[];
  simStrategy: SimStrategy;
  intervalMs: number;
  dailyLimit: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalTasks: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLog {
  id: string;
  campaignId: string;
  phoneNumber: string;
  status: TaskStatus;
  deviceId: string | null;
  simSlot: number | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}
