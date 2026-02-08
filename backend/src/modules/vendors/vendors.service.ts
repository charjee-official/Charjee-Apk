import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VendorsRepository } from './vendors.repository';

@Injectable()
export class VendorsService {
  constructor(private readonly repository: VendorsRepository) {}

  listAll() {
    return this.repository.listAll();
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  async approveVendor(id: string) {
    await this.repository.updateKyc(id, 'Approved');
    await this.repository.updateStatus(id, 'Active');
    return this.getById(id);
  }

  async rejectVendor(id: string) {
    await this.repository.updateKyc(id, 'Rejected');
    await this.repository.updateStatus(id, 'Suspended');
    return this.getById(id);
  }

  async suspendVendor(id: string) {
    await this.repository.updateStatus(id, 'Suspended');
    return this.getById(id);
  }

  async createVendor(input: { name: string; status?: string; kyc?: string }) {
    const id = randomUUID();
    await this.repository.createVendor(
      id,
      input.name,
      input.status ?? 'Active',
      input.kyc ?? 'Pending',
    );
    return this.getById(id);
  }
}
