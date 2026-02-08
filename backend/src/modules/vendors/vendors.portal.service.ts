import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { DevicesService } from '../devices/devices.service';
import { VendorsPortalRepository } from './vendors.portal.repository';

@Injectable()
export class VendorsPortalService {
  constructor(
    private readonly repository: VendorsPortalRepository,
    private readonly devicesService: DevicesService,
    private readonly usersRepository: UsersRepository,
  ) {}

  getDashboard(vendorId: string) {
    return this.repository.getDashboardStats(vendorId);
  }

  listDevices(vendorId: string) {
    return this.devicesService.listByVendor(vendorId);
  }

  listAlerts(vendorId: string) {
    return this.repository.listVendorAlerts(vendorId);
  }

  listSessions(vendorId: string, filters: {
    startDate?: string;
    endDate?: string;
    deviceId?: string;
    userId?: string;
    status?: string;
  }) {
    return this.repository.listVendorSessions(vendorId, filters);
  }

  listTransactions(vendorId: string) {
    return this.repository.listVendorLedger(vendorId);
  }

  listSettlements(vendorId: string) {
    return this.repository.listVendorSettlements(vendorId);
  }

  getSettlementSummary(vendorId: string) {
    return this.repository.getSettlementSummary(vendorId);
  }

  listUsers(vendorId: string) {
    return this.repository.listVendorUsers(vendorId);
  }

  async enableDevice(vendorId: string, deviceId: string) {
    await this.ensureDeviceOwnership(vendorId, deviceId);
    return this.devicesService.enableDevice(deviceId);
  }

  async disableDevice(vendorId: string, deviceId: string) {
    await this.ensureDeviceOwnership(vendorId, deviceId);
    return this.devicesService.disableDevice(deviceId);
  }

  async createUser(vendorId: string, phone: string, name?: string) {
    const enabled = process.env.VENDOR_USER_CREATE_ENABLED === 'true';
    if (!enabled) {
      throw new BadRequestException('Vendor user creation is disabled');
    }

    const user = await this.usersRepository.createUser(phone, name);
    return { vendorId, user };
  }

  createDeviceRequest(vendorId: string, payload: {
    deviceId?: string;
    stationId?: string;
    location?: string;
    reason: string;
  }) {
    return this.repository.createDeviceRequest(vendorId, payload);
  }

  listDeviceRequests(vendorId: string) {
    return this.repository.listDeviceRequests(vendorId);
  }

  listNotifications(vendorId: string) {
    return this.repository.listNotifications(vendorId);
  }

  markNotificationRead(vendorId: string, id: string) {
    return this.repository.markNotificationRead(vendorId, id);
  }

  createSupportTicket(vendorId: string, subject: string, priority: string) {
    return this.repository.createSupportTicket(vendorId, subject, priority);
  }

  listSupportTickets(vendorId: string) {
    return this.repository.listSupportTickets(vendorId);
  }

  closeSupportTicket(vendorId: string, ticketId: string) {
    return this.repository.closeSupportTicket(vendorId, ticketId);
  }

  addSupportMessage(vendorId: string, ticketId: string, message: string, attachments?: string[]) {
    return this.repository.addSupportMessage({
      ticketId,
      vendorId,
      message,
      attachments: attachments ?? null,
      senderRole: 'vendor',
    });
  }

  listSupportMessages(vendorId: string, ticketId: string) {
    return this.repository.listSupportMessages(vendorId, ticketId);
  }

  async assignUserToDevice(vendorId: string, userId: string, deviceId: string) {
    await this.ensureDeviceOwnership(vendorId, deviceId);
    return this.repository.createUserAssignment(vendorId, userId, deviceId);
  }

  listUserAssignments(vendorId: string) {
    return this.repository.listUserAssignments(vendorId);
  }

  async setUserAssignmentStatus(vendorId: string, assignmentId: string, status: string) {
    await this.repository.updateUserAssignmentStatus(vendorId, assignmentId, status);
    return { ok: true };
  }

  private async ensureDeviceOwnership(vendorId: string, deviceId: string) {
    const ownerId = await this.repository.getDeviceVendorId(deviceId);
    if (!ownerId || ownerId !== vendorId) {
      throw new BadRequestException('Device not in vendor scope');
    }
  }
}
