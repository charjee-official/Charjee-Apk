import { IsOptional, IsString } from 'class-validator';

export class CreateStationDto {
  @IsString()
  stationId!: string;

  @IsString()
  vendorId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;
}
