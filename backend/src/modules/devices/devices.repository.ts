import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface DeviceRecord {
  id: string;
  vendorId: string | null;
  stationId: string | null;
  status: string;
}

@Injectable()
export class DevicesRepository {
  private readonly logger = new Logger(DevicesRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async create(device: DeviceRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO devices (id, vendor_id, station_id, status)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        [device.id, device.vendorId, device.stationId, device.status],
      );
    } catch (error) {
      this.logger.error(`Failed to create device: ${String(error)}`);
    }
  }

  async updateStatus(id: string, status: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE devices SET status=$2 WHERE id=$1`, [id, status]);
    } catch (error) {
      this.logger.error(`Failed to update device status: ${String(error)}`);
    }
  }

  async listByVendor(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, vendor_id, station_id, status FROM devices WHERE vendor_id=$1`,
      [vendorId],
    );
    return result.rows as DeviceRecord[];
  }
}
