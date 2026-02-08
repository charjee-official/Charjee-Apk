import { IsIn, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_CATEGORIES, DOCUMENT_TYPES } from '../vendor.constants';

export class VendorDocumentDto {
  @IsIn(DOCUMENT_CATEGORIES)
  documentCategory!: string;

  @IsIn(DOCUMENT_TYPES)
  documentType!: string;

  @IsString()
  fileUrl!: string;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;
}
