import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VendorOauthExchangeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  codeVerifier?: string;

  @IsString()
  @IsNotEmpty()
  redirectUri!: string;
}
