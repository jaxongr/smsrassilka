import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

interface WebSocketEvents {
  onCampaignProgress?: (data: {
    campaignId: string;
    sent: number;
    delivered: number;
    failed: number;
    total: number;
  }) => void;
  onDeviceOnline?: (data: { deviceId: string; isOnline: boolean }) => void;
  onDeviceStatus?: (data: {
    deviceId: string;
    batteryLevel: number;
    signalStrength: number;
  }) => void;
  onTaskUpdate?: (data: {
    taskId: string;
    campaignId: string;
    status: string;
    phoneNumber: string;
  }) => void;
  onInboxMessage?: (data: {
    id: string;
    phoneNumber: string;
    body: string;
    deviceName: string;
  }) => void;
}

export function useWebSocket(events?: WebSocketEvents) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  const connect = useCallback(() => {
    if (!token) return;

    const socket = io('/ws/dashboard', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    if (events?.onCampaignProgress) {
      socket.on('campaign_progress', events.onCampaignProgress);
    }
    if (events?.onDeviceOnline) {
      socket.on('device_online', events.onDeviceOnline);
    }
    if (events?.onDeviceStatus) {
      socket.on('device_status', events.onDeviceStatus);
    }
    if (events?.onTaskUpdate) {
      socket.on('task_update', events.onTaskUpdate);
    }
    if (events?.onInboxMessage) {
      socket.on('inbox_message', events.onInboxMessage);
    }

    socketRef.current = socket;
  }, [token, events]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  return { isConnected, socket: socketRef.current };
}
