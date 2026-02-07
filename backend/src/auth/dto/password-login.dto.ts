import { IsString } from 'class-validator';

export class PasswordLoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}
