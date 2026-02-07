import { Injectable } from '@nestjs/common';
import { StationsRepository } from './stations.repository';

@Injectable()
export class StationsService {
  constructor(private readonly repository: StationsRepository) {}

  createStation(id: string, vendorId: string, name: string, address?: string) {
    return this.repository.create({ id, vendorId, name, address });
  }

  listByVendor(vendorId: string) {
    return this.repository.listByVendor(vendorId);
  }
}
