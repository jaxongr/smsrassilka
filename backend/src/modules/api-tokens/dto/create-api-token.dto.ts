import { IsString, IsArray, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiTokenDto {
  @ApiProperty({ example: 'My Integration Token' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    example: ['sms:send', 'call:send', 'status:read'],
    description: 'List of permissions for this token',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[] = [];
}
