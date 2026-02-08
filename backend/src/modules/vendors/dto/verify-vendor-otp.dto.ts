import { IsString, MinLength } from 'class-validator';

export class VerifyVendorOtpDto {
  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(4)
  otp!: string;
}
