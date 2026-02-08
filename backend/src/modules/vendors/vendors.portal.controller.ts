import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { VendorAssignUserDto } from './dto/vendor-assign-user.dto';
import { VendorDeviceRequestDto } from './dto/vendor-device-request.dto';
import { VendorSessionQueryDto } from './dto/vendor-session-query.dto';
import { VendorSupportMessageDto } from './dto/vendor-support-message.dto';
import { VendorSupportTicketDto } from './dto/vendor-support-ticket.dto';
import { VendorUserCreateDto } from './dto/vendor-user-create.dto';
import { VendorsPortalService } from './vendors.portal.service';

@ApiTags('Vendors (Portal)')
@ApiBearerAuth()
@Controller('vendors/portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor')
export class VendorsPortalController {
  constructor(private readonly portalService: VendorsPortalService) {}

  @Get('dashboard')
  getDashboard(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.getDashboard(vendorId);
  }

  @Get('devices')
  listDevices(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listDevices(vendorId);
  }

  @Post('devices/:id/enable')
  enableDevice(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.enableDevice(vendorId, id);
  }

  @Post('devices/:id/disable')
  disableDevice(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.disableDevice(vendorId, id);
  }

  @Get('alerts')
  listAlerts(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listAlerts(vendorId);
  }

  @Get('sessions')
  listSessions(@Req() request: any, @Query() query: VendorSessionQueryDto) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listSessions(vendorId, query);
  }

  @Get('transactions')
  listTransactions(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listTransactions(vendorId);
  }

  @Get('settlements')
  listSettlements(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listSettlements(vendorId);
  }

  @Get('settlements/summary')
  settlementSummary(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.getSettlementSummary(vendorId);
  }

  @Get('users')
  listUsers(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listUsers(vendorId);
  }

  @Post('users')
  createUser(@Req() request: any, @Body() input: VendorUserCreateDto) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.createUser(vendorId, input.phone, input.name);
  }

  @Get('users/assignments')
  listUserAssignments(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listUserAssignments(vendorId);
  }

  @Post('users/assignments')
  assignUser(@Req() request: any, @Body() input: VendorAssignUserDto) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.assignUserToDevice(vendorId, input.userId, input.deviceId);
  }

  @Post('users/assignments/:id/disable')
  disableUserAssignment(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.setUserAssignmentStatus(vendorId, id, 'DISABLED');
  }

  @Post('users/assignments/:id/enable')
  enableUserAssignment(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.setUserAssignmentStatus(vendorId, id, 'ACTIVE');
  }

  @Post('device-requests')
  createDeviceRequest(@Req() request: any, @Body() input: VendorDeviceRequestDto) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.createDeviceRequest(vendorId, input);
  }

  @Get('device-requests')
  listDeviceRequests(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listDeviceRequests(vendorId);
  }

  @Get('notifications')
  listNotifications(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listNotifications(vendorId);
  }

  @Post('notifications/:id/read')
  markNotificationRead(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.markNotificationRead(vendorId, id);
  }

  @Get('support/tickets')
  listTickets(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listSupportTickets(vendorId);
  }

  @Post('support/tickets')
  createTicket(@Req() request: any, @Body() input: VendorSupportTicketDto) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.createSupportTicket(vendorId, input.subject, input.priority);
  }

  @Get('support/tickets/:id/messages')
  listTicketMessages(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.listSupportMessages(vendorId, id);
  }

  @Post('support/tickets/:id/messages')
  addTicketMessage(
    @Req() request: any,
    @Param('id') id: string,
    @Body() input: VendorSupportMessageDto,
  ) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.addSupportMessage(vendorId, id, input.message, input.attachments);
  }

  @Post('support/tickets/:id/close')
  closeTicket(@Req() request: any, @Param('id') id: string) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.portalService.closeSupportTicket(vendorId, id);
  }
}
