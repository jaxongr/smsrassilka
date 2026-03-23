import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription plan and usage' })
  @ApiResponse({ status: 200, description: 'Current subscription info' })
  async getCurrent(@Request() req: any) {
    const [plan, usage] = await Promise.all([
      this.subscriptionsService.getCurrentPlan(req.user.id),
      this.subscriptionsService.getUsage(req.user.id),
    ]);

    return { subscription: plan, usage };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans' })
  @ApiResponse({ status: 200, description: 'List of available plans' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan upgraded successfully' })
  async upgrade(@Request() req: any, @Body() body: { plan: SubscriptionPlan }) {
    return this.subscriptionsService.upgradePlan(req.user.id, body.plan);
  }
}
