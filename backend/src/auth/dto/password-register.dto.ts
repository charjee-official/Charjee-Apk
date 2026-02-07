import { IsIn, IsString } from 'class-validator';
import { UserRole } from '../auth.service';

export class PasswordRegisterDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsIn(['vendor', 'admin'])
  role!: Extract<UserRole, 'vendor' | 'admin'>;

  @IsString()
  subjectId!: string;
}
