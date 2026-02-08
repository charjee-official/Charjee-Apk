import { Injectable } from '@nestjs/common';
import { StationsRepository } from './stations.repository';

@Injectable()
export class StationsService {
  constructor(private readonly repository: StationsRepository) {}

  createStation(id: string, vendorId: string, name: string, address?: string) {
    return this.repository.create({
      id,
      vendorId,
      name,
      address,
      status: 'Active',
    });
  }

  listAll() {
    return this.repository.listAll();
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  listByVendor(vendorId: string) {
    return this.repository.listByVendor(vendorId);
  }

  async enableStation(id: string) {
    await this.repository.updateStatus(id, 'Active');
    return this.repository.getById(id);
  }

  async disableStation(id: string) {
    await this.repository.updateStatus(id, 'Disabled');
    return this.repository.getById(id);
  }
}
