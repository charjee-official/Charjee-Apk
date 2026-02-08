import { IsIn, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_STATUSES } from '../vendor.constants';

export class VendorDocumentReviewDto {
  @IsIn(DOCUMENT_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
