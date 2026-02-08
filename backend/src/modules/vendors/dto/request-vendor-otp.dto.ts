import { IsString, MinLength } from 'class-validator';

export class RequestVendorOtpDto {
  @IsString()
  @MinLength(8)
  phone!: string;
}
