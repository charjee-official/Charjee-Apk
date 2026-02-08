import { IsOptional, IsString } from 'class-validator';

export class VendorUserCreateDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
