import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { VoiceMessagesService } from './voice-messages.service';
import { VoiceMessagesController } from './voice-messages.controller';

@Module({
  imports: [StorageModule],
  controllers: [VoiceMessagesController],
  providers: [VoiceMessagesService],
  exports: [VoiceMessagesService],
})
export class VoiceMessagesModule {}
