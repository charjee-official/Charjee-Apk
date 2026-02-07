import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateStationDto } from './dto/create-station.dto';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

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

  @Get('vendor/:vendorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  listByVendor(@Param('vendorId') vendorId: string) {
    return this.stationsService.listByVendor(vendorId);
  }
}
