import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
