export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  totalContacts: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalSmsSent: number;
  totalSmsDelivered: number;
  totalSmsFailed: number;
  deliveryRate: number;
  todaySmsSent: number;
  unreadInbox: number;
  blacklistCount: number;
}

export interface DailyUsage {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface DeliveryReport {
  campaignId: string;
  campaignName: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  statusBreakdown: Record<string, number>;
}
