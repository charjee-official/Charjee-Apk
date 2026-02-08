import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface StationRecord {
  id: string;
  vendorId: string;
  name: string;
  address?: string;
  status: string;
  deviceCount?: number;
}

@Injectable()
export class StationsRepository {
  private readonly logger = new Logger(StationsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async create(station: StationRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO stations (id, vendor_id, name, address, status)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [
          station.id,
          station.vendorId,
          station.name,
          station.address ?? null,
          station.status,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to create station: ${String(error)}`);
    }
  }

  async updateStatus(id: string, status: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE stations SET status=$2 WHERE id=$1`, [id, status]);
    } catch (error) {
      this.logger.error(`Failed to update station status: ${String(error)}`);
    }
  }

  async listAll() {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT s.id,
             s.vendor_id,
             s.name,
             s.address,
             s.status,
             COUNT(d.id) AS device_count
      FROM stations s
      LEFT JOIN devices d ON d.station_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      `,
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      name: row.name,
      address: row.address ?? undefined,
      status: row.status,
      deviceCount: Number(row.device_count ?? 0),
    })) as StationRecord[];
  }

  async getById(id: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT s.id,
             s.vendor_id,
             s.name,
             s.address,
             s.status,
             COUNT(d.id) AS device_count
      FROM stations s
      LEFT JOIN devices d ON d.station_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
      LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      return undefined;
    }
    return {
      id: row.id,
      vendorId: row.vendor_id,
      name: row.name,
      address: row.address ?? undefined,
      status: row.status,
      deviceCount: Number(row.device_count ?? 0),
    } as StationRecord;
  }

  async listByVendor(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT s.id,
             s.vendor_id,
             s.name,
             s.address,
             s.status,
             COUNT(d.id) AS device_count
      FROM stations s
      LEFT JOIN devices d ON d.station_id = s.id
      WHERE s.vendor_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
      `,
      [vendorId],
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      name: row.name,
      address: row.address ?? undefined,
      status: row.status,
      deviceCount: Number(row.device_count ?? 0),
    })) as StationRecord[];
  }
}
