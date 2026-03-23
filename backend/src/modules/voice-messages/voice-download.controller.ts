import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { VoiceMessagesService } from './voice-messages.service';

@ApiTags('Voice Download')
@Controller('api/voice-download')
export class VoiceDownloadController {
  constructor(private readonly voiceMessagesService: VoiceMessagesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Download voice message (public, for devices)' })
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
