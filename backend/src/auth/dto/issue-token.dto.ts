import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../auth.service';

export class IssueTokenDto {
  @IsString()
  userId!: string;

  @IsIn(['user', 'vendor', 'admin'])
  role!: UserRole;

  @IsOptional()
  @IsString()
  vendorId?: string;
}
