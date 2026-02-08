import { IsArray, IsOptional, IsString } from 'class-validator';

export class VendorSupportMessageDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
