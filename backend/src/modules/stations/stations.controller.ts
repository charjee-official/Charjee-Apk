import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DevicesService } from '../devices/devices.service';
import { CreateStationDto } from './dto/create-station.dto';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(
    private readonly stationsService: StationsService,
    private readonly devicesService: DevicesService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  create(@Body() input: CreateStationDto) {
    return this.stationsService.createStation(
      input.stationId,
      input.vendorId,
      input.name,
      input.address,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAll() {
    return this.stationsService.listAll();
  }

  @Get('vendor/:vendorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  listByVendor(@Param('vendorId') vendorId: string) {
    return this.stationsService.listByVendor(vendorId);
  }

  @Get(':id/devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listDevices(@Param('id') id: string) {
    return this.devicesService.listByStation(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getById(@Param('id') id: string) {
    return this.stationsService.getById(id);
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  enable(@Param('id') id: string) {
    return this.stationsService.enableStation(id);
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  disable(@Param('id') id: string) {
    return this.stationsService.disableStation(id);
  }
}
