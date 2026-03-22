import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class TaskResultDto {
  @IsUUID()
  taskId: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsInt()
  callDuration?: number;

  @IsOptional()
  @IsBoolean()
  callAnswered?: boolean;
}
