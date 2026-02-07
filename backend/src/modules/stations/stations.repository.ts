import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface StationRecord {
  id: string;
  vendorId: string;
  name: string;
  address?: string;
}

@Injectable()
export class StationsRepository {
  private readonly logger = new Logger(StationsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async create(station: StationRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO stations (id, vendor_id, name, address)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        [station.id, station.vendorId, station.name, station.address ?? null],
      );
    } catch (error) {
      this.logger.error(`Failed to create station: ${String(error)}`);
    }
  }

  async listByVendor(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, vendor_id, name, address FROM stations WHERE vendor_id=$1`,
      [vendorId],
    );
    return result.rows as StationRecord[];
  }
}
