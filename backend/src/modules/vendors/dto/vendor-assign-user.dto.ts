import { IsString } from 'class-validator';

export class VendorAssignUserDto {
	@IsString()
	userId!: string;

	@IsString()
	deviceId!: string;
}
