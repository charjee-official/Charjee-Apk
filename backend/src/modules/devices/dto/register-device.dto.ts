import { IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  deviceId!: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  stationId?: string;
}
