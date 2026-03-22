import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ namespace: '/ws/dashboard', cors: true })
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;

      if (!token) {
        this.logger.warn('Dashboard connection rejected: no token');
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('jwt.secret', 'jwt-secret');
      const payload = this.jwtService.verify(token, { secret });

      if (!payload || !payload.sub) {
        this.logger.warn('Dashboard connection rejected: invalid token');
        client.disconnect();
        return;
      }

      // Store user info on the socket
      (client as any).userId = payload.sub;
      (client as any).userRole = payload.role;

      // Join user-specific room for targeted broadcasts
      client.join(`user:${payload.sub}`);

      this.logger.log(`Dashboard client connected: user ${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Dashboard connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.logger.log(`Dashboard client disconnected: user ${userId}`);
    }
  }

  /**
   * Broadcast campaign progress stats to all dashboard clients.
   */
  broadcastCampaignProgress(campaignId: string, stats: any) {
    this.server.emit('campaign:progress', { campaignId, ...stats });
  }

  /**
   * Broadcast device status change to all dashboard clients.
   */
  broadcastDeviceStatus(deviceId: string, status: any) {
    this.server.emit('device:status', { deviceId, ...status });
  }

  /**
   * Broadcast individual task update to all dashboard clients.
   */
  broadcastTaskUpdate(task: any) {
    this.server.emit('task:update', task);
  }

  /**
   * Broadcast new inbox message to all dashboard clients.
   */
  broadcastInboxMessage(message: any) {
    this.server.emit('inbox:new', message);
  }
}
