import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VendorEmailOtpVerifyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}
