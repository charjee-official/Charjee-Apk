import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VendorEmailResetConfirmDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
