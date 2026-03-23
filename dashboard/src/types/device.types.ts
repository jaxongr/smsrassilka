export interface SimCard {
  id: string;
  slotIndex: number;
  phoneNumber: string | null;
  operatorName: string | null;
  isActive: boolean;
  smsCapable: boolean;
  callCapable: boolean;
  dailySmsCount: number;
  dailyCallCount: number;
  dailyLimitSms: number;
  dailyLimitCall: number;
}

export interface Device {
  id: string;
  name: string;
  deviceToken: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  batteryLevel: number | null;
  signalStrength: number | null;
  simCards: SimCard[];
  createdAt: string;
  updatedAt: string;
}
