import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StartSessionDto {
  @IsString()
  deviceId!: string;

  @IsString()
  userId!: string;

  @IsString()
  vendorId!: string;

  @IsIn(['car', 'bike'])
  vehicleType!: 'car' | 'bike';

  @IsInt()
  @Min(1)
  timerMinutes!: number;

  @IsOptional()
  @IsString()
  bookingId?: string;
}
