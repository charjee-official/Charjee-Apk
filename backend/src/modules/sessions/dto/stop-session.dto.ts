import { IsOptional, IsString } from 'class-validator';

export class StopSessionDto {
  @IsString()
  sessionId!: string;

  @IsString()
  deviceId!: string;

  @IsOptional()
  timerMinutes?: number;
}
