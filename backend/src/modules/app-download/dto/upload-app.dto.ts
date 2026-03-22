import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadAppDto {
  @ApiProperty({ description: 'App version', example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  version: string;
}
