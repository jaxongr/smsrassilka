export interface InboxMessage {
  id: string;
  phoneNumber: string;
  body: string;
  deviceId: string;
  deviceName: string;
  simSlot: number;
  isRead: boolean;
  receivedAt: string;
  createdAt: string;
}

export interface InboxReply {
  messageId: string;
  body: string;
  deviceId?: string;
  simSlot?: number;
}
