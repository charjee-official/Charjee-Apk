import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostgresService } from '../../database/postgres.service';

export interface AlertRecord {
  id: string;
  deviceId: string;
  type: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class AlertsRepository {
  private readonly logger = new Logger(AlertsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<AlertRecord[]> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, device_id, type, status, created_at
      FROM alerts
      ORDER BY created_at DESC
      `,
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      deviceId: row.device_id,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async updateStatus(id: string, status: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE alerts SET status=$2 WHERE id=$1`, [id, status]);
    } catch (error) {
      this.logger.error(`Failed to update alert status: ${String(error)}`);
    }
  }

  async hasOpenAlert(deviceId: string, type: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT 1 FROM alerts WHERE device_id=$1 AND type=$2 AND status='Open' LIMIT 1`,
      [deviceId, type],
    );
    return result.rowCount > 0;
  }

  async createAlert(deviceId: string, type: string) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `INSERT INTO alerts (id, device_id, type, status) VALUES ($1,$2,$3,'Open')`,
        [id, deviceId, type],
      );
    } catch (error) {
      this.logger.error(`Failed to create alert: ${String(error)}`);
    }
  }
}
