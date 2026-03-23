import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ example: '+998901234567', description: 'Phone number to send SMS to' })
  @IsString()
  @MinLength(1)
  to: string;

  @ApiProperty({ example: 'Hello from API!', description: 'SMS message body' })
  @IsString()
  @MinLength(1)
  message: string;
}
