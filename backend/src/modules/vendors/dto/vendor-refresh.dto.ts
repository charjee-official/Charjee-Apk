import { IsString } from 'class-validator';

export class VendorRefreshDto {
  @IsString()
  refreshToken!: string;
}
