import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendCallDto {
  @ApiProperty({ example: '+998901234567', description: 'Phone number to call' })
  @IsString()
  @MinLength(1)
  to: string;

  @ApiProperty({ example: 'uuid-of-voice-message', description: 'Voice message ID to play' })
  @IsString()
  @MinLength(1)
  voiceMessageId: string;
}
