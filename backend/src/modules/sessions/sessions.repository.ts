import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';
import { EnergyDataPayload, SessionRecord } from './session.types';

@Injectable()
export class SessionsRepository {
  private readonly logger = new Logger(SessionsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async createSession(session: SessionRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `
        INSERT INTO sessions (
          id, device_id, user_id, vendor_id, booking_id, vehicle_type, status,
          started_at, ended_at, price_per_kwh, platform_fee_pct,
          energy_kwh, amount, platform_amount, vendor_amount,
          close_reason, illegal
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          session.sessionId,
          session.deviceId,
          session.userId,
          session.vendorId,
          session.bookingId ?? null,
          session.vehicleType,
          session.status,
          session.startedAt ?? null,
          session.endedAt ?? null,
          session.pricePerKwh,
          session.platformFeePct,
          session.energyKwh,
          session.amount,
          session.platformAmount,
          session.vendorAmount,
          session.closeReason ?? null,
          session.illegal ?? false,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to create session: ${String(error)}`);
    }
  }

  async updateSession(session: SessionRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `
        UPDATE sessions
        SET status = $2,
            started_at = $3,
            ended_at = $4,
            energy_kwh = $5,
            amount = $6,
            platform_amount = $7,
            vendor_amount = $8,
            close_reason = $9,
            illegal = $10
        WHERE id = $1
        `,
        [
          session.sessionId,
          session.status,
          session.startedAt ?? null,
          session.endedAt ?? null,
          session.energyKwh,
          session.amount,
          session.platformAmount,
          session.vendorAmount,
          session.closeReason ?? null,
          session.illegal ?? false,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to update session: ${String(error)}`);
    }
  }

  async insertTelemetry(sessionId: string, data: EnergyDataPayload) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `
        INSERT INTO telemetry (
          session_id, device_id, rpt, st, v, p, e, tpwh, up,
          ts, ct, ill, amt, rt, sid, tr
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        `,
        [
          sessionId,
          data.id,
          data.rpt,
          data.st,
          data.v ?? null,
          data.p ?? null,
          data.e ?? null,
          data.tpwh ?? null,
          data.up ?? null,
          data.ts,
          data.ct ?? null,
          data.ill ?? null,
          data.amt ?? null,
          data.rt ?? null,
          data.sid ?? null,
          data.tr ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to insert telemetry: ${String(error)}`);
    }
  }

  async listActiveSessions() {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id,
             device_id,
             user_id,
             vendor_id,
             status,
             started_at,
             ended_at,
             energy_kwh,
             amount,
             platform_amount,
             vendor_amount,
              close_reason,
              illegal,
             booking_id,
             vehicle_type
      FROM sessions
      WHERE status IN ('ACTIVE', 'PENDING')
      ORDER BY started_at DESC NULLS LAST
      `,
    );
    return result.rows;
  }

  async listHistorySessions() {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id,
             device_id,
             user_id,
             vendor_id,
             status,
             started_at,
             ended_at,
             energy_kwh,
             amount,
             platform_amount,
             vendor_amount,
              close_reason,
              illegal,
             booking_id,
             vehicle_type
      FROM sessions
      WHERE status = 'STOPPED'
      ORDER BY ended_at DESC NULLS LAST
      `,
    );
    return result.rows;
  }

  async getById(sessionId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id,
             device_id,
             user_id,
             vendor_id,
             status,
             started_at,
             ended_at,
             energy_kwh,
             amount,
             platform_amount,
             vendor_amount,
              close_reason,
              illegal,
             booking_id,
             vehicle_type
      FROM sessions
      WHERE id = $1
      LIMIT 1
      `,
      [sessionId],
    );
    return result.rows[0];
  }

  async listFinanceSessions() {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id,
             vendor_id,
             amount,
             platform_amount,
             vendor_amount,
             started_at
      FROM sessions
      ORDER BY started_at DESC NULLS LAST
      `,
    );
    return result.rows;
  }

  async forceStop(sessionId: string) {
    const pool = this.postgres.getPool();
    await pool.query(
      `
      UPDATE sessions
      SET status = 'STOPPED',
          ended_at = NOW(),
          close_reason = 'Force stop'
      WHERE id = $1
      `,
      [sessionId],
    );
  }

  async hasWalletLedger(sessionId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT 1 FROM wallet_ledger WHERE session_id=$1 LIMIT 1`,
      [sessionId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async hasVendorLedger(sessionId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT 1 FROM vendor_ledger WHERE session_id=$1 LIMIT 1`,
      [sessionId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async insertWalletLedger(userId: string, sessionId: string, amount: number, type: string) {
    const pool = this.postgres.getPool();
    await pool.query(
      `INSERT INTO wallet_ledger (user_id, session_id, amount, type)
       VALUES ($1,$2,$3,$4)`,
      [userId, sessionId, amount, type],
    );
  }

  async insertVendorLedger(vendorId: string, sessionId: string, amount: number) {
    const pool = this.postgres.getPool();
    await pool.query(
      `INSERT INTO vendor_ledger (vendor_id, session_id, amount)
       VALUES ($1,$2,$3)`,
      [vendorId, sessionId, amount],
    );
  }
}
