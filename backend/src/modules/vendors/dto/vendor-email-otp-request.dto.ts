import { IsEmail } from 'class-validator';

export class VendorEmailOtpRequestDto {
  @IsEmail()
  email!: string;
}
