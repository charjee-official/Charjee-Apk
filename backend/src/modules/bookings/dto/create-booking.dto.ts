import { IsISO8601, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  deviceId!: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;
}
