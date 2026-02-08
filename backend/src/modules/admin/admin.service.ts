import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

@Injectable()
export class AdminService {
  constructor(private readonly postgres: PostgresService) {}

  async getDashboardStats() {
    const pool = this.postgres.getPool();
    const vendors = await pool.query('SELECT COUNT(*) FROM vendors');
    const stations = await pool.query('SELECT COUNT(*) FROM stations');
    const devices = await pool.query('SELECT COUNT(*) FROM devices');
    const devicesOnline = await pool.query(
      "SELECT COUNT(*) FROM devices WHERE status = 'online' AND enabled = true",
    );
    const activeSessions = await pool.query(
      "SELECT COUNT(*) FROM sessions WHERE status IN ('ACTIVE','PENDING')",
    );
    const energyToday = await pool.query(
      'SELECT COALESCE(SUM(energy_kwh),0) AS total FROM sessions WHERE started_at::date = CURRENT_DATE',
    );
    const revenueToday = await pool.query(
      'SELECT COALESCE(SUM(amount),0) AS total FROM sessions WHERE started_at::date = CURRENT_DATE',
    );
    const platformEarnings = await pool.query(
      'SELECT COALESCE(SUM(platform_amount),0) AS total FROM sessions WHERE started_at::date = CURRENT_DATE',
    );
    const criticalAlerts = await pool.query(
      "SELECT COUNT(*) FROM alerts WHERE status = 'Open'",
    );

    return {
      vendors: Number(vendors.rows[0]?.count ?? 0),
      stations: Number(stations.rows[0]?.count ?? 0),
      devices: Number(devices.rows[0]?.count ?? 0),
      devicesOnline: Number(devicesOnline.rows[0]?.count ?? 0),
      activeSessions: Number(activeSessions.rows[0]?.count ?? 0),
      energyToday: Number(energyToday.rows[0]?.total ?? 0),
      revenueToday: Number(revenueToday.rows[0]?.total ?? 0),
      platformEarnings: Number(platformEarnings.rows[0]?.total ?? 0),
      criticalAlerts: Number(criticalAlerts.rows[0]?.count ?? 0),
    };
  }
}
