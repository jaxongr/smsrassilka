import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { VoiceMessagesService } from './voice-messages.service';
import { VoiceMessagesController } from './voice-messages.controller';
import { VoiceDownloadController } from './voice-download.controller';

@Module({
  imports: [StorageModule],
  controllers: [VoiceMessagesController, VoiceDownloadController],
  providers: [VoiceMessagesService],
  exports: [VoiceMessagesService],
})
export class VoiceMessagesModule {}
