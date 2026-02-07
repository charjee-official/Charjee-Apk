import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  register(@Body() input: RegisterDeviceDto) {
    return this.devicesService.registerDevice(
      input.deviceId,
      input.vendorId,
      input.stationId,
    );
  }

  @Get('vendor/:vendorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  listByVendor(@Param('vendorId') vendorId: string) {
    return this.devicesService.listByVendor(vendorId);
  }
}
