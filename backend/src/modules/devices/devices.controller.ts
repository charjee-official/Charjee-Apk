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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAll() {
    return this.devicesService.listAll();
  }

  @Get('vendor/:vendorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  listByVendor(@Param('vendorId') vendorId: string) {
    return this.devicesService.listByVendor(vendorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getById(@Param('id') id: string) {
    return this.devicesService.getById(id);
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  enable(@Param('id') id: string) {
    return this.devicesService.enableDevice(id);
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  disable(@Param('id') id: string) {
    return this.devicesService.disableDevice(id);
  }
}
