import { IsString, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(4)
  otp!: string;
}
