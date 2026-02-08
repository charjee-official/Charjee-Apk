import { IsOptional, IsString } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  kyc?: string;
}
