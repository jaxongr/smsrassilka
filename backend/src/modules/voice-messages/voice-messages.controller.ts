import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VoiceMessagesService } from './voice-messages.service';

@ApiTags('Voice Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/voice-messages')
export class VoiceMessagesController {
  constructor(private readonly voiceMessagesService: VoiceMessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all voice messages' })
  findAll(@CurrentUser('id') userId: string) {
    return this.voiceMessagesService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Upload a voice message' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
  ) {
    return this.voiceMessagesService.create(userId, file, name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voice message by ID' })
  findOne(@Param('id') id: string) {
    return this.voiceMessagesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a voice message' })
  remove(@Param('id') id: string) {
    return this.voiceMessagesService.remove(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a voice message file' })
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const voiceMessage = await this.voiceMessagesService.findOne(id);
    const filePath = await this.voiceMessagesService.getFilePath(id);

    res.set({
      'Content-Type': voiceMessage.mimeType,
      'Content-Disposition': `attachment; filename="${voiceMessage.fileName}"`,
    });

    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }
}
