import { IsEmail } from 'class-validator';

export class VendorEmailResetRequestDto {
  @IsEmail()
  email!: string;
}
