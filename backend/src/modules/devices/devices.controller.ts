import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UpdateSimDto } from './dto/update-sim.dto';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user devices' })
  findAll(@CurrentUser('id') userId: string) {
    return this.devicesService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.devicesService.register(userId, dto);
  }

  @Get('online')
  @ApiOperation({ summary: 'Get all online devices' })
  findOnlineDevices() {
    return this.devicesService.findOnlineDevices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.devicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove device' })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }

  @Patch(':id/sims/:slotIndex')
  @ApiOperation({ summary: 'Update SIM card settings' })
  updateSimCard(
    @Param('id') deviceId: string,
    @Param('slotIndex') slotIndex: string,
    @Body() dto: UpdateSimDto,
  ) {
    return this.devicesService.updateSimCard(deviceId, parseInt(slotIndex, 10), dto);
  }

  @Patch(':id/limits')
  @ApiOperation({ summary: 'Qurilma uchun SMS/Call limitni belgilash' })
  updateLimits(
    @Param('id') id: string,
    @Body() dto: { smsLimit?: number; callLimit?: number },
  ) {
    return this.devicesService.updateLimits(id, dto);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Qurilmani bloklash (SMS yuborilmaydi)' })
  blockDevice(@Param('id') id: string) {
    return this.devicesService.setBlocked(id, true);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Qurilmani blokdan chiqarish' })
  unblockDevice(@Param('id') id: string) {
    return this.devicesService.setBlocked(id, false);
  }

  @Post(':id/reset-counters')
  @ApiOperation({ summary: 'SMS/Call counterlarni 0 ga qaytarish' })
  resetCounters(@Param('id') id: string) {
    return this.devicesService.resetCounters(id);
  }
}
