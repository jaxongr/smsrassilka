import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTokensService } from './api-tokens.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import { UpdateApiTokenDto } from './dto/update-api-token.dto';

@ApiTags('API Tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/api-tokens')
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API token (returns full token once)' })
  @ApiResponse({ status: 201, description: 'Token created successfully' })
  async create(@Request() req: any, @Body() dto: CreateApiTokenDto) {
    return this.apiTokensService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all API tokens (prefix only)' })
  @ApiResponse({ status: 200, description: 'List of tokens' })
  async findAll(@Request() req: any) {
    return this.apiTokensService.findAllByUser(req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an API token' })
  @ApiResponse({ status: 200, description: 'Token updated successfully' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateApiTokenDto,
  ) {
    return this.apiTokensService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API token' })
  @ApiResponse({ status: 200, description: 'Token deleted successfully' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.apiTokensService.delete(id, req.user.sub);
  }
}
