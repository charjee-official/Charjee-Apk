import { IsIn, IsOptional, IsString } from 'class-validator';

export class VendorSessionQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE', 'STOPPED'])
  status?: 'PENDING' | 'ACTIVE' | 'STOPPED';
}
