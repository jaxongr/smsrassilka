import { IsInt, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';

export class DeviceStatusDto {
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel: number;

  @IsInt()
  @Min(0)
  @Max(4)
  signalStrength: number;

  @IsOptional()
  @IsString()
  networkType?: string;

  @IsOptional()
  @IsBoolean()
  isCharging?: boolean;
}
