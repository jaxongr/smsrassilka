export interface DashboardStats {
  smsSentToday: number;
  smsSentMonth: number;
  callsToday: number;
  callsMonth: number;
  activeCampaigns: number;
  totalCampaigns: number;
  onlineDevices: number;
  totalDevices: number;
  totalContacts: number;
  totalSmsSent: number;
  totalSmsDelivered: number;
  totalSmsFailed: number;
  blacklistCount: number;
  unreadInbox: number;
  deliveryRate: number;
}

export interface DailyUsage {
  date: string;
  sms: number;
  calls: number;
}

export interface DeliveryReport {
  campaign: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  breakdown: {
    total: number;
    pending: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    cancelled: number;
  };
  percentages: {
    deliveredRate: number;
    failedRate: number;
    sentRate: number;
    completionRate: number;
  };
}
