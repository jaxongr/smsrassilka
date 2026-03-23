import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ApiTokenAuthGuard } from '../../common/guards/api-token-auth.guard';
import { ExternalApiService } from './external-api.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendCallDto } from './dto/send-call.dto';

@ApiTags('External API v1')
@ApiHeader({ name: 'x-api-key', description: 'API token for authentication' })
@UseGuards(ApiTokenAuthGuard)
@Controller('api/v1')
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}

  @Post('sms/send')
  @ApiOperation({ summary: 'Send an SMS via API' })
  @ApiResponse({ status: 201, description: 'SMS queued for sending' })
  @ApiResponse({ status: 403, description: 'Daily limit reached' })
  async sendSms(@Request() req: any, @Body() dto: SendSmsDto) {
    return this.externalApiService.sendSms(req.user.id, dto);
  }

  @Post('call/send')
  @ApiOperation({ summary: 'Send a call via API' })
  @ApiResponse({ status: 201, description: 'Call queued for sending' })
  @ApiResponse({ status: 403, description: 'Daily limit reached' })
  async sendCall(@Request() req: any, @Body() dto: SendCallDto) {
    return this.externalApiService.sendCall(req.user.id, dto);
  }

  @Get('sms/status/:taskId')
  @ApiOperation({ summary: 'Get task status' })
  @ApiResponse({ status: 200, description: 'Task status info' })
  async getTaskStatus(@Request() req: any, @Param('taskId') taskId: string) {
    return this.externalApiService.getTaskStatus(req.user.id, taskId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get usage vs limits balance' })
  @ApiResponse({ status: 200, description: 'Current usage and limits' })
  async getBalance(@Request() req: any) {
    return this.externalApiService.getBalance(req.user.id);
  }
}
