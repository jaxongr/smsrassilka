import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { AppDownloadService } from './app-download.service';
import { UploadAppDto } from './dto/upload-app.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('App Download')
@Controller('api/app')
export class AppDownloadController {
  constructor(private readonly appDownloadService: AppDownloadService) {}

  @Get('download')
  @ApiOperation({ summary: 'Download the mobile APK file' })
  @ApiResponse({ status: 200, description: 'APK file stream' })
  @ApiResponse({ status: 404, description: 'APK file not found' })
  async downloadApp(@Res({ passthrough: true }) res: Response) {
    const filePath = this.appDownloadService.getAppFilePath();
    const info = await this.appDownloadService.getAppInfo();

    res.set({
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${info.fileName}"`,
    });

    const fileStream = fs.createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  @Get('info')
  @ApiOperation({ summary: 'Get app version and file info' })
  @ApiResponse({ status: 200, description: 'App info returned' })
  async getAppInfo() {
    const info = await this.appDownloadService.getAppInfo();
    return { data: info };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload new APK file (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        version: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'APK uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async uploadApp(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAppDto,
  ) {
    const result = await this.appDownloadService.uploadApp(file, dto.version);
    return { data: result, message: 'APK muvaffaqiyatli yuklandi' };
  }
}
