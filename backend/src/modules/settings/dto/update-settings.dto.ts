import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  platformFeePct?: number;

  @IsOptional()
  @IsNumber()
  minWalletCar?: number;

  @IsOptional()
  @IsNumber()
  minWalletBike?: number;

  @IsOptional()
  @IsBoolean()
  bookingsEnabled?: boolean;
}
