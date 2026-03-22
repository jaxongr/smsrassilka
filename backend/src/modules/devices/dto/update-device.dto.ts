import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateDeviceDto {
  @ApiPropertyOptional({ description: 'Device name', example: 'Samsung Galaxy S21' })
  @IsString()
  @IsOptional()
  name?: string;
}
