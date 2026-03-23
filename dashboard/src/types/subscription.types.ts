export interface Subscription {
  id: string;
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  maxDevices: number;
  maxSmsPerDay: number;
  maxCallsPerDay: number;
}

export interface PlanInfo {
  name: string;
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  maxDevices: number;
  maxSmsPerDay: number;
  maxCallsPerDay: number;
  price: number;
  features: string[];
}
