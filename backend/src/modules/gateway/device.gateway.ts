import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TaskQueueService } from '../task-queue/task-queue.service';
import { DashboardGateway } from './dashboard.gateway';
import { TaskStatus } from '@prisma/client';

const DEVICE_SOCKET_MAP_KEY = 'device:socket:map';
const SOCKET_DEVICE_MAP_KEY = 'socket:device:map';

@WebSocketGateway({ namespace: '/ws/device', cors: true })
export class DeviceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeviceGateway.name);

  /** In-memory map for fast socket lookup: deviceId -> socketId */
  private deviceSocketMap = new Map<string, string>();
  /** Reverse map: socketId -> deviceId */
  private socketDeviceMap = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Try query param first, then auth header, then handshake auth
      const deviceToken = (client.handshake.query.token as string)
        || (client.handshake.auth?.token as string)
        || (client.handshake.headers?.['x-device-token'] as string);

      this.logger.log(`Connection attempt - query: ${!!client.handshake.query.token}, auth: ${!!client.handshake.auth?.token}, headers: ${JSON.stringify(Object.keys(client.handshake.headers || {}))}`);

      if (!deviceToken) {
        this.logger.warn(`Device connection rejected: no token provided. Query keys: ${Object.keys(client.handshake.query)}`);
        client.disconnect();
        return;
      }

      const device = await this.prisma.device.findUnique({
        where: { deviceToken },
      });

      if (!device) {
        this.logger.warn(`Device connection rejected: invalid token`);
        client.disconnect();
        return;
      }

      // Agar bu qurilma uchun eski socket bor bo'lsa - eski aloqani uzib, yangisini qabul qilamiz
      const oldSocketId = this.deviceSocketMap.get(device.id);
      if (oldSocketId && oldSocketId !== client.id) {
        this.logger.log(`Device ${device.name} reconnected, closing old socket ${oldSocketId}`);
        this.socketDeviceMap.delete(oldSocketId);
        try {
          const oldSocket = (this.server.sockets as any).get(oldSocketId);
          if (oldSocket) oldSocket.disconnect(true);
        } catch (_) {}
      }

      // Store socket mapping
      this.deviceSocketMap.set(device.id, client.id);
      this.socketDeviceMap.set(client.id, device.id);

      // Store in Redis for cross-instance access
      await this.redisService.set(
        `${DEVICE_SOCKET_MAP_KEY}:${device.id}`,
        client.id,
        86400,
      );
      await this.redisService.set(
        `${SOCKET_DEVICE_MAP_KEY}:${client.id}`,
        device.id,
        86400,
      );

      // Set device online
      await this.prisma.device.update({
        where: { id: device.id },
        data: { isOnline: true, lastSeenAt: new Date() },
      });

      this.logger.log(`Device connected: ${device.name} (${device.id})`);

      // Broadcast to dashboard
      this.dashboardGateway.broadcastDeviceStatus(device.id, {
        isOnline: true,
        name: device.name,
      });

      // Qayta ulanganda "yuborilgan lekin javob kelmagan" tasklarni qayta queue ga qo'yamiz
      const stuckTasks = await this.prisma.taskLog.findMany({
        where: {
          deviceId: device.id,
          status: TaskStatus.SENT_TO_DEVICE,
        },
        select: { id: true, campaignId: true },
      });

      if (stuckTasks.length > 0) {
        this.logger.log(`Re-queuing ${stuckTasks.length} stuck tasks for device ${device.id}`);
        for (const task of stuckTasks) {
          await this.prisma.taskLog.update({
            where: { id: task.id },
            data: { status: TaskStatus.QUEUED, deviceId: null, simSlot: null },
          });
        }
        // TaskQueue ga xabar beramiz - qayta queue qilsin
        try {
          const campaignIds = [...new Set(stuckTasks.map(t => t.campaignId))];
          for (const cid of campaignIds) {
            const tqs = this._taskQueueService;
            if (tqs?.requeueStuckTasks) {
              await tqs.requeueStuckTasks(cid);
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to requeue tasks: ${e.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Device connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const deviceId = this.socketDeviceMap.get(client.id);

      if (deviceId) {
        // Clean up maps
        this.deviceSocketMap.delete(deviceId);
        this.socketDeviceMap.delete(client.id);

        await this.redisService.del(`${DEVICE_SOCKET_MAP_KEY}:${deviceId}`);
        await this.redisService.del(`${SOCKET_DEVICE_MAP_KEY}:${client.id}`);

        // Set device offline
        await this.prisma.device.update({
          where: { id: deviceId },
          data: { isOnline: false, lastSeenAt: new Date() },
        });

        // Re-queue any tasks that were assigned to this device and not yet completed
        const pendingTasks = await this.prisma.taskLog.findMany({
          where: {
            deviceId,
            status: TaskStatus.SENT_TO_DEVICE,
          },
          select: { id: true, campaignId: true },
        });

        if (pendingTasks.length > 0) {
          await this.prisma.taskLog.updateMany({
            where: {
              id: { in: pendingTasks.map((t) => t.id) },
            },
            data: {
              status: TaskStatus.QUEUED,
              deviceId: null,
              simSlot: null,
            },
          });

          this.logger.log(
            `Re-queued ${pendingTasks.length} tasks from disconnected device ${deviceId}`,
          );
        }

        this.logger.log(`Device disconnected: ${deviceId}`);

        this.dashboardGateway.broadcastDeviceStatus(deviceId, { isOnline: false });
      }
    } catch (error) {
      this.logger.error(`Device disconnect error: ${error.message}`);
    }
  }

  @SubscribeMessage('task_result')
  async handleTaskResult(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      taskId: string;
      status: string;
      errorMessage?: string;
      callDuration?: number;
      callAnswered?: boolean;
    },
  ) {
    try {
      await this.getTaskQueueService().handleTaskResult(data.taskId, {
        status: data.status as TaskStatus,
        errorMessage: data.errorMessage,
        callDuration: data.callDuration,
        callAnswered: data.callAnswered,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Task result error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('device_status')
  async handleDeviceStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      batteryLevel: number;
      signalStrength: number;
      networkType?: string;
      isCharging?: boolean;
    },
  ) {
    try {
      const deviceId = this.socketDeviceMap.get(client.id);
      if (!deviceId) return;

      await this.prisma.device.update({
        where: { id: deviceId },
        data: {
          batteryLevel: data.batteryLevel,
          signalStrength: data.signalStrength,
          lastSeenAt: new Date(),
        },
      });

      this.dashboardGateway.broadcastDeviceStatus(deviceId, {
        isOnline: true,
        batteryLevel: data.batteryLevel,
        signalStrength: data.signalStrength,
        networkType: data.networkType,
        isCharging: data.isCharging,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Device status error: ${error.message}`);
      return { success: false };
    }
  }

  @SubscribeMessage('sim_status')
  async handleSimStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: any,
  ) {
    try {
      const deviceId = this.socketDeviceMap.get(client.id);
      if (!deviceId) return;

      // Accept both single object and array
      const data = Array.isArray(rawData) ? rawData : [rawData];

      for (const sim of data) {
        await this.prisma.simCard.upsert({
          where: {
            deviceId_slotIndex: {
              deviceId,
              slotIndex: sim.slotIndex,
            },
          },
          create: {
            deviceId,
            slotIndex: sim.slotIndex,
            operatorName: sim.operatorName,
            phoneNumber: sim.phoneNumber,
            isActive: sim.isActive,
            smsCapable: sim.smsCapable ?? true,
            callCapable: sim.callCapable ?? true,
          },
          update: {
            operatorName: sim.operatorName,
            phoneNumber: sim.phoneNumber,
            isActive: sim.isActive,
            smsCapable: sim.smsCapable ?? true,
            callCapable: sim.callCapable ?? true,
          },
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`SIM status error: ${error.message}`);
      return { success: false };
    }
  }

  @SubscribeMessage('incoming_sms')
  async handleIncomingSms(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      fromNumber: string;
      toNumber?: string;
      body: string;
      simSlot?: number;
      receivedAt?: string;
    },
  ) {
    try {
      const deviceId = this.socketDeviceMap.get(client.id);
      if (!deviceId) return;

      const message = await this.prisma.inboxMessage.create({
        data: {
          deviceId,
          simSlot: data.simSlot,
          fromNumber: data.fromNumber,
          toNumber: data.toNumber,
          body: data.body,
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        },
      });

      // Broadcast to dashboard
      this.dashboardGateway.broadcastInboxMessage(message);

      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error(`Incoming SMS error: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Send a task (SMS/call) to a specific device via its WebSocket connection.
   * Returns true if the message was emitted, false if device is not connected.
   */
  async sendTask(deviceId: string, task: any): Promise<boolean> {
    const socketId = this.deviceSocketMap.get(deviceId);

    if (!socketId) {
      this.logger.warn(`Device ${deviceId} not connected, cannot send task`);
      return false;
    }

    const socket = (this.server.sockets as any).get(socketId);

    if (!socket) {
      // Socket no longer exists, clean up
      this.deviceSocketMap.delete(deviceId);
      this.logger.warn(`Socket ${socketId} not found for device ${deviceId}`);
      return false;
    }

    const event = task.type === 'SMS' ? 'send_sms' : 'make_call';
    socket.emit(event, task);

    this.logger.debug(`Task ${task.taskId} sent to device ${deviceId} via ${event}`);
    return true;
  }

  /**
   * Get socket ID for a device from the in-memory map.
   */
  getSocketIdByDeviceId(deviceId: string): string | undefined {
    return this.deviceSocketMap.get(deviceId);
  }

  /**
   * Check if a device is currently connected.
   */
  isDeviceConnected(deviceId: string): boolean {
    return this.deviceSocketMap.has(deviceId);
  }

  /**
   * Lazily resolve TaskQueueService to handle circular dependency.
   */
  private _taskQueueService: any;

  setTaskQueueService(service: any) {
    this._taskQueueService = service;
  }

  private getTaskQueueService() {
    if (!this._taskQueueService) {
      throw new Error('TaskQueueService not initialized in DeviceGateway');
    }
    return this._taskQueueService;
  }
}
