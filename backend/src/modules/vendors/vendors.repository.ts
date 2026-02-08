import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface VendorRecord {
  id: string;
  name: string;
  status: string;
  kyc: string;
  revenue: number;
}

@Injectable()
export class VendorsRepository {
  private readonly logger = new Logger(VendorsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<VendorRecord[]> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT v.id,
             v.name,
             v.status,
             v.kyc_status,
             COALESCE(SUM(s.amount), 0) AS revenue
      FROM vendors v
      LEFT JOIN sessions s ON s.vendor_id = v.id
      GROUP BY v.id
      ORDER BY v.created_at DESC
      `,
    );
    return result.rows.map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      status: String(row.status),
      kyc: String(row.kyc_status),
      revenue: Number(row.revenue ?? 0),
    }));
  }

  async getById(id: string): Promise<VendorRecord | null> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT v.id,
             v.name,
             v.status,
             v.kyc_status,
             COALESCE(SUM(s.amount), 0) AS revenue
      FROM vendors v
      LEFT JOIN sessions s ON s.vendor_id = v.id
      WHERE v.id = $1
      GROUP BY v.id
      LIMIT 1
      `,
      [id],
    );
    if ((result.rowCount ?? 0) === 0) {
      return null;
    }
    const row = result.rows[0] as any;
    return {
      id: String(row?.id),
      name: String(row?.name),
      status: String(row?.status),
      kyc: String(row?.kyc_status),
      revenue: Number(row?.revenue ?? 0),
    };
  }

  async updateStatus(id: string, status: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE vendors SET status=$2 WHERE id=$1`, [id, status]);
    } catch (error) {
      this.logger.error(`Failed to update vendor status: ${String(error)}`);
    }
  }

  async updateKyc(id: string, kycStatus: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(`UPDATE vendors SET kyc_status=$2 WHERE id=$1`, [id, kycStatus]);
    } catch (error) {
      this.logger.error(`Failed to update vendor kyc: ${String(error)}`);
    }
  }

  async createVendor(id: string, name: string, status: string, kyc: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO vendors (id, name, status, kyc_status)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, status, kyc],
      );
    } catch (error) {
      this.logger.error(`Failed to create vendor: ${String(error)}`);
    }
  }
}
