import { IsOptional, IsString } from 'class-validator';

export class VendorDeviceRequestDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  stationId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  reason!: string;
}
