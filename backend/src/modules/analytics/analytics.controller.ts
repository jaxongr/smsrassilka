import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  getDashboardStats(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboardStats(userId);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get campaign analytics with daily breakdown' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getCampaignAnalytics(
    @CurrentUser('id') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getCampaignAnalytics(userId, from, to);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get device utilization analytics' })
  getDeviceAnalytics(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDeviceAnalytics(userId);
  }

  @Get('daily-usage')
  @ApiOperation({ summary: 'Get daily SMS/call usage for last N days' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDailyUsage(
    @CurrentUser('id') userId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getDailyUsage(userId, days ? parseInt(days, 10) : 30);
  }

  @Get('campaigns/:id/report')
  @ApiOperation({ summary: 'Get detailed delivery report for a campaign' })
  getDeliveryReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getDeliveryReport(id);
  }
}
