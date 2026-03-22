import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all campaigns (paginated)' })
  findAll(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.campaignsService.findAll(userId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign (DRAFT only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign (DRAFT only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.remove(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a campaign' })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.start(id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a running campaign' })
  pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.pause(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused campaign' })
  resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.resume(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a campaign' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.cancel(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.getStats(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get campaign task logs (paginated)' })
  getLogs(@Param('id', ParseUUIDPipe) id: string, @Query() pagination: PaginationDto) {
    return this.campaignsService.getLogs(id, pagination);
  }
}
