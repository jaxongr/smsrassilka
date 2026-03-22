import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSimDto {
  @ApiPropertyOptional({ description: 'Whether the SIM card is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Daily SMS sending limit', example: 200 })
  @IsInt()
  @Min(0)
  @IsOptional()
  dailyLimitSms?: number;

  @ApiPropertyOptional({ description: 'Daily call limit', example: 100 })
  @IsInt()
  @Min(0)
  @IsOptional()
  dailyLimitCall?: number;
}
