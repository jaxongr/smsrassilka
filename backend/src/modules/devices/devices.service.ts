import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UpdateSimDto } from './dto/update-sim.dto';
import { SimStrategy } from '@prisma/client';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      include: { simCards: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: { simCards: true },
    });

    if (!device) {
      throw new NotFoundException(`Device with ID "${id}" not found`);
    }

    return device;
  }

  async register(userId: string, dto: RegisterDeviceDto) {
    const deviceToken = crypto.randomBytes(32).toString('hex');

    const device = await this.prisma.device.create({
      data: {
        name: dto.name,
        deviceToken,
        userId,
      },
      include: { simCards: true },
    });

    this.logger.log(`Device registered: ${device.id} for user ${userId}`);

    return { ...device, deviceToken };
  }

  async update(id: string, dto: UpdateDeviceDto) {
    await this.findOne(id);

    return this.prisma.device.update({
      where: { id },
      data: dto,
      include: { simCards: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.device.delete({
      where: { id },
    });
  }

  async findOnlineDevices() {
    return this.prisma.device.findMany({
      where: { isOnline: true },
      include: { simCards: true },
    });
  }

  async setOnline(id: string, isOnline: boolean) {
    return this.prisma.device.update({
      where: { id },
      data: {
        isOnline,
        lastSeenAt: new Date(),
      },
    });
  }

  async updateSimCard(deviceId: string, slotIndex: number, dto: UpdateSimDto) {
    return this.prisma.simCard.upsert({
      where: {
        deviceId_slotIndex: { deviceId, slotIndex },
      },
      update: dto,
      create: {
        deviceId,
        slotIndex,
        ...dto,
      },
    });
  }

  async updateDeviceStatus(id: string, batteryLevel: number, signalStrength: number) {
    return this.prisma.device.update({
      where: { id },
      data: {
        batteryLevel,
        signalStrength,
        lastSeenAt: new Date(),
      },
    });
  }

  async getAvailableDevice(
    deviceIds: string[],
    type: 'SMS' | 'CALL',
    simStrategy: SimStrategy,
  ) {
    const devices = await this.prisma.device.findMany({
      where: {
        id: { in: deviceIds },
        isOnline: true,
      },
      include: { simCards: true },
    });

    if (!devices.length) {
      return null;
    }

    for (const device of devices) {
      const availableSims = device.simCards.filter((sim) => {
        if (!sim.isActive) return false;

        if (type === 'SMS') {
          return sim.smsCapable && sim.dailySmsCount < sim.dailyLimitSms;
        }
        return sim.callCapable && sim.dailyCallCount < sim.dailyLimitCall;
      });

      if (!availableSims.length) continue;

      let selectedSim;

      switch (simStrategy) {
        case SimStrategy.SIM_1_ONLY:
          selectedSim = availableSims.find((s) => s.slotIndex === 0);
          break;
        case SimStrategy.SIM_2_ONLY:
          selectedSim = availableSims.find((s) => s.slotIndex === 1);
          break;
        case SimStrategy.LOAD_BALANCE: {
          const countKey = type === 'SMS' ? 'dailySmsCount' : 'dailyCallCount';
          selectedSim = availableSims.sort((a, b) => a[countKey] - b[countKey])[0];
          break;
        }
        case SimStrategy.ROUND_ROBIN:
        default: {
          const countKey = type === 'SMS' ? 'dailySmsCount' : 'dailyCallCount';
          selectedSim = availableSims.sort((a, b) => a[countKey] - b[countKey])[0];
          break;
        }
      }

      if (selectedSim) {
        return { device, simCard: selectedSim };
      }
    }

    return null;
  }
}
