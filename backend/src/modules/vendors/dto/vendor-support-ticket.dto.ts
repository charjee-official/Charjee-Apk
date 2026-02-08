import { IsIn, IsString } from 'class-validator';

export class VendorSupportTicketDto {
  @IsString()
  subject!: string;

  @IsIn(['LOW', 'NORMAL', 'HIGH'])
  priority!: 'LOW' | 'NORMAL' | 'HIGH';
}
