import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DevicesService } from '../devices/devices.service';
import { StationsService } from '../stations/stations.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { VendorDocumentReviewDto } from './dto/vendor-document-review.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors (Admin)')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly stationsService: StationsService,
    private readonly devicesService: DevicesService,
  ) {}

  @Get()
  listAll() {
    return this.vendorsService.listAll();
  }

  @Post()
  create(@Body() input: CreateVendorDto) {
    return this.vendorsService.createVendor(input);
  }

  @Get(':id/stations')
  listStations(@Param('id') id: string) {
    return this.stationsService.listByVendor(id);
  }

  @Get(':id/devices')
  listDevices(@Param('id') id: string) {
    return this.devicesService.listByVendor(id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.vendorsService.getById(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.vendorsService.approveVendor(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.vendorsService.rejectVendor(id);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.vendorsService.suspendVendor(id);
  }

  @Get(':id/documents')
  listDocuments(@Param('id') id: string) {
    return this.vendorsService.listVendorDocuments(id);
  }

  @Post(':id/documents/:documentId/review')
  reviewDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() input: VendorDocumentReviewDto,
    @Req() request: any,
  ) {
    const adminId = request?.user?.sub ? String(request.user.sub) : null;
    return this.vendorsService.reviewVendorDocument({
      vendorId: id,
      documentId,
      status: input.status,
      adminId,
      reason: input.reason ?? null,
    });
  }
}
