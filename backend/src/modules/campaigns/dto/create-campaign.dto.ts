import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  IsDateString,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType, SimStrategy } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Spring Promo Campaign' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CampaignType, example: CampaignType.SMS })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiPropertyOptional({ example: 'Hello {{firstName}}, check out our deals!' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({ description: 'Voice message ID for CALL campaigns' })
  @IsOptional()
  @IsUUID()
  voiceMessageId?: string;

  @ApiProperty({ description: 'Contact group to send to' })
  @IsUUID()
  contactGroupId: string;

  @ApiProperty({ description: 'Device IDs to use for sending', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  deviceIds: string[];

  @ApiPropertyOptional({ description: 'Schedule campaign for later' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Interval between tasks in ms per device (1000=60 SMS/min/device)', default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(500)
  intervalMs?: number = 1000;

  @ApiPropertyOptional({ enum: SimStrategy, default: SimStrategy.ROUND_ROBIN })
  @IsOptional()
  @IsEnum(SimStrategy)
  simStrategy?: SimStrategy = SimStrategy.ROUND_ROBIN;
}
