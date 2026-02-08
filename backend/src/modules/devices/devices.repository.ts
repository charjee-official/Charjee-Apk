import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface DeviceRecord {
  id: string;
  vendorId: string | null;
  stationId: string | null;
  status: string;
  enabled: boolean;
  lastHeartbeat?: Date | null;
  lastIllegal?: number | null;
}

@Injectable()
export class DevicesRepository {
  private readonly logger = new Logger(DevicesRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async create(device: DeviceRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO devices (id, vendor_id, station_id, status, enabled)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [device.id, device.vendorId, device.stationId, device.status, device.enabled],
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

  async updateEnabled(id: string, enabled: boolean) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE devices SET enabled=$2 WHERE id=$1`, [id, enabled]);
    } catch (error) {
      this.logger.error(`Failed to update device enabled: ${String(error)}`);
    }
  }

  async listAll() {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT d.id,
             d.vendor_id,
             d.station_id,
             d.status,
             d.enabled,
             t.created_at AS last_heartbeat,
             t.ill AS last_illegal
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT created_at, ill
        FROM telemetry t
        WHERE t.device_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) t ON true
      ORDER BY d.created_at DESC
      `,
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      stationId: row.station_id,
      status: row.status,
      enabled: row.enabled,
      lastHeartbeat: row.last_heartbeat ?? null,
      lastIllegal: row.last_illegal ?? null,
    })) as DeviceRecord[];
  }

  async getById(id: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT d.id,
             d.vendor_id,
             d.station_id,
             d.status,
             d.enabled,
             t.created_at AS last_heartbeat,
             t.ill AS last_illegal
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT created_at, ill
        FROM telemetry t
        WHERE t.device_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) t ON true
      WHERE d.id = $1
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
      stationId: row.station_id,
      status: row.status,
      enabled: row.enabled,
      lastHeartbeat: row.last_heartbeat ?? null,
      lastIllegal: row.last_illegal ?? null,
    } as DeviceRecord;
  }

  async listByVendor(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT d.id,
             d.vendor_id,
             d.station_id,
             d.status,
             d.enabled,
             t.created_at AS last_heartbeat,
             t.ill AS last_illegal
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT created_at, ill
        FROM telemetry t
        WHERE t.device_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) t ON true
      WHERE d.vendor_id = $1
      ORDER BY d.created_at DESC
      `,
      [vendorId],
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      stationId: row.station_id,
      status: row.status,
      enabled: row.enabled,
      lastHeartbeat: row.last_heartbeat ?? null,
      lastIllegal: row.last_illegal ?? null,
    })) as DeviceRecord[];
  }

  async listByStation(stationId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT d.id,
             d.vendor_id,
             d.station_id,
             d.status,
             d.enabled,
             t.created_at AS last_heartbeat,
             t.ill AS last_illegal
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT created_at, ill
        FROM telemetry t
        WHERE t.device_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) t ON true
      WHERE d.station_id = $1
      ORDER BY d.created_at DESC
      `,
      [stationId],
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      stationId: row.station_id,
      status: row.status,
      enabled: row.enabled,
      lastHeartbeat: row.last_heartbeat ?? null,
      lastIllegal: row.last_illegal ?? null,
    })) as DeviceRecord[];
  }
}
