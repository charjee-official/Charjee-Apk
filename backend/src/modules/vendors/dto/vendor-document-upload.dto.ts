import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VendorDocumentUploadDto {
  @IsString()
  @IsNotEmpty()
  documentCategory!: string;

  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;
}
