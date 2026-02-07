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
          energy_kwh, amount, platform_amount, vendor_amount
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
            vendor_amount = $8
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
}
