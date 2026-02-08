import { Injectable } from '@nestjs/common';
import { DevicesRepository, DeviceRecord } from './devices.repository';

@Injectable()
export class DevicesService {
  constructor(private readonly repository: DevicesRepository) {}

  registerDevice(id: string, vendorId?: string, stationId?: string) {
    const record: DeviceRecord = {
      id,
      vendorId: vendorId ?? null,
      stationId: stationId ?? null,
      status: 'offline',
      enabled: true,
    };

    return this.repository.create(record);
  }

  markOnline(id: string) {
    return this.repository.updateStatus(id, 'online');
  }

  markOffline(id: string) {
    return this.repository.updateStatus(id, 'offline');
  }

  listByVendor(vendorId: string) {
    return this.repository.listByVendor(vendorId).then((rows) =>
      rows.map((row) => this.toAdminDevice(row)),
    );
  }

  listByStation(stationId: string) {
    return this.repository.listByStation(stationId).then((rows) =>
      rows.map((row) => this.toAdminDevice(row)),
    );
  }

  listAll() {
    return this.repository.listAll().then((rows) =>
      rows.map((row) => this.toAdminDevice(row)),
    );
  }

  async getById(id: string) {
    const row = await this.repository.getById(id);
    return row ? this.toAdminDevice(row) : null;
  }

  async enableDevice(id: string) {
    await this.repository.updateEnabled(id, true);
    return this.getById(id);
  }

  async disableDevice(id: string) {
    await this.repository.updateEnabled(id, false);
    return this.getById(id);
  }

  private toAdminDevice(row: DeviceRecord) {
    const status = row.enabled ? row.status : 'Disabled';
    return {
      id: row.id,
      vendorId: row.vendorId,
      stationId: row.stationId,
      status,
      lastHeartbeat: row.lastHeartbeat ?? null,
      fault: row.lastIllegal ? 'Illegal consumption' : null,
    };
  }
}
