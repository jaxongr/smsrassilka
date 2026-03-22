export interface SimCard {
  id: string;
  slotIndex: number;
  phoneNumber: string | null;
  operator: string | null;
  isActive: boolean;
  signalStrength: number | null;
  dailySentCount: number;
  dailyLimit: number;
}

export interface Device {
  id: string;
  name: string;
  deviceId: string;
  apiKey: string;
  isOnline: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  signalStrength: number | null;
  model: string | null;
  osVersion: string | null;
  appVersion: string | null;
  simCards: SimCard[];
  createdAt: string;
  updatedAt: string;
}
