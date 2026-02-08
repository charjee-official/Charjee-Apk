import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class VendorEmailRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
