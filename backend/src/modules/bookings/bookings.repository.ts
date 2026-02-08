import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface BookingRecord {
  id: string;
  userId: string;
  deviceId: string;
  startAt: Date;
  endAt: Date;
  status: string;
}

@Injectable()
export class BookingsRepository {
  private readonly logger = new Logger(BookingsRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async create(booking: BookingRecord) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `INSERT INTO bookings (id, user_id, device_id, start_at, end_at, status)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO NOTHING`,
        [
          booking.id,
          booking.userId,
          booking.deviceId,
          booking.startAt,
          booking.endAt,
          booking.status,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to create booking: ${String(error)}`);
    }
  }

  async listByUser(userId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, user_id, device_id, start_at, end_at, status
       FROM bookings WHERE user_id=$1 ORDER BY start_at DESC`,
      [userId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
    })) as BookingRecord[];
  }

  async listAll() {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, user_id, device_id, start_at, end_at, status
       FROM bookings ORDER BY start_at DESC`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
    })) as BookingRecord[];
  }

  async hasConflict(deviceId: string, startAt: Date, endAt: Date) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT 1
      FROM bookings
      WHERE device_id = $1
        AND status IN ('BOOKED', 'ACTIVE')
        AND NOT (end_at <= $2 OR start_at >= $3)
      LIMIT 1
      `,
      [deviceId, startAt, endAt],
    );
    return result.rowCount > 0;
  }

  async getActiveBooking(
    userId: string,
    deviceId: string,
    at: Date,
    atMinusGrace: Date,
  ) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, user_id, device_id, start_at, end_at, status
      FROM bookings
      WHERE user_id = $1
        AND device_id = $2
        AND status IN ('BOOKED', 'ACTIVE')
        AND start_at <= $3
        AND end_at >= $4
      LIMIT 1
      `,
      [userId, deviceId, at, atMinusGrace],
    );
    return result.rows[0] as BookingRecord | undefined;
  }

  async markActive(bookingId: string) {
    const pool = this.postgres.getPool();
    await pool.query(`UPDATE bookings SET status='ACTIVE' WHERE id=$1`, [
      bookingId,
    ]);
  }

  async markCompleted(bookingId: string) {
    const pool = this.postgres.getPool();
    await pool.query(`UPDATE bookings SET status='COMPLETED' WHERE id=$1`, [
      bookingId,
    ]);
  }

  async expireNoShows(before: Date) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      UPDATE bookings
      SET status = 'EXPIRED'
      WHERE status = 'BOOKED'
        AND end_at < $1
      RETURNING id
      `,
      [before],
    );
    return result.rowCount;
  }
}
