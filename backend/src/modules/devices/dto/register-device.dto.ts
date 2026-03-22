import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Device name', example: 'Samsung Galaxy S21' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
