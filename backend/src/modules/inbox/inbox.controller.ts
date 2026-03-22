import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InboxService } from './inbox.service';

@ApiTags('Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inbox messages (paginated)' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'fromNumber', required: false, type: String })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('isRead') isRead?: string,
    @Query('fromNumber') fromNumber?: string,
  ) {
    const filters: { isRead?: boolean; fromNumber?: string } = {};
    if (isRead !== undefined) {
      filters.isRead = isRead === 'true';
    }
    if (fromNumber) {
      filters.fromNumber = fromNumber;
    }

    return this.inboxService.findAll(pagination, filters);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  getUnreadCount() {
    return this.inboxService.getUnreadCount();
  }

  @Get('conversation/:phoneNumber')
  @ApiOperation({ summary: 'Get conversation thread by phone number' })
  getConversation(@Param('phoneNumber') phoneNumber: string) {
    return this.inboxService.getConversation(phoneNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inbox message by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboxService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboxService.markAsRead(id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all messages as read' })
  markAllAsRead() {
    return this.inboxService.markAllAsRead();
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to an inbox message' })
  reply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { body: string; deviceId?: string; simSlot?: number },
  ) {
    return this.inboxService.reply(id, body.body, body.deviceId, body.simSlot);
  }
}
