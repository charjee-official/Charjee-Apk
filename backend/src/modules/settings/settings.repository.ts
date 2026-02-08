import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface AdminSettingsRecord {
  platformFeePct: number;
  minWalletCar: number;
  minWalletBike: number;
  bookingsEnabled: boolean;
  updatedAt: Date;
}

@Injectable()
export class SettingsRepository {
  private readonly logger = new Logger(SettingsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async getSettings(): Promise<AdminSettingsRecord> {
    const pool = this.postgres.getPool();
    await pool.query(
      `INSERT INTO admin_settings (id) VALUES (1)
       ON CONFLICT (id) DO NOTHING`,
    );
    const result = await pool.query(
      `
      SELECT platform_fee_pct,
             min_wallet_car,
             min_wallet_bike,
             bookings_enabled,
             updated_at
      FROM admin_settings
      WHERE id = 1
      `,
    );
    const row = result.rows[0];
    return {
      platformFeePct: Number(row.platform_fee_pct ?? 20),
      minWalletCar: Number(row.min_wallet_car ?? 700),
      minWalletBike: Number(row.min_wallet_bike ?? 300),
      bookingsEnabled: Boolean(row.bookings_enabled),
      updatedAt: row.updated_at,
    };
  }

  async updateSettings(update: Partial<AdminSettingsRecord>) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `
        UPDATE admin_settings
        SET platform_fee_pct = COALESCE($1, platform_fee_pct),
            min_wallet_car = COALESCE($2, min_wallet_car),
            min_wallet_bike = COALESCE($3, min_wallet_bike),
            bookings_enabled = COALESCE($4, bookings_enabled),
            updated_at = NOW()
        WHERE id = 1
        `,
        [
          update.platformFeePct ?? null,
          update.minWalletCar ?? null,
          update.minWalletBike ?? null,
          update.bookingsEnabled ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to update admin settings: ${String(error)}`);
    }
  }
}
