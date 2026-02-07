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
    return this.repository.listByVendor(vendorId);
  }
}
