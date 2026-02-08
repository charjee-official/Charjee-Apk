import { IsEmail, IsString } from 'class-validator';

export class VendorEmailLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
