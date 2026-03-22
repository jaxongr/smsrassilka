import { Module } from '@nestjs/common';
import { AppDownloadController } from './app-download.controller';
import { AppDownloadService } from './app-download.service';

@Module({
  controllers: [AppDownloadController],
  providers: [AppDownloadService],
})
export class AppDownloadModule {}
