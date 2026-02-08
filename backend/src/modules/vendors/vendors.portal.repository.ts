import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostgresService } from '../../database/postgres.service';

@Injectable()
export class VendorsPortalRepository {
  private readonly logger = new Logger(VendorsPortalRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async getDashboardStats(vendorId: string) {
    const pool = this.postgres.getPool();
    const [devices, activeDevices, users, revenueToday, revenueMonth, alerts] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM devices WHERE vendor_id=$1`, [vendorId]),
      pool.query(
        `SELECT COUNT(*) FROM devices WHERE vendor_id=$1 AND enabled=TRUE AND status='online'`,
        [vendorId],
      ),
      pool.query(
        `SELECT COUNT(DISTINCT user_id) FROM sessions WHERE vendor_id=$1`,
        [vendorId],
      ),
      pool.query(
        `
        SELECT COALESCE(SUM(vendor_amount), 0) AS total
        FROM sessions
        WHERE vendor_id=$1
          AND COALESCE(ended_at, started_at) >= CURRENT_DATE
          AND COALESCE(ended_at, started_at) < CURRENT_DATE + INTERVAL '1 day'
        `,
        [vendorId],
      ),
      pool.query(
        `
        SELECT COALESCE(SUM(vendor_amount), 0) AS total
        FROM sessions
        WHERE vendor_id=$1
          AND date_trunc('month', COALESCE(ended_at, started_at)) = date_trunc('month', NOW())
        `,
        [vendorId],
      ),
      pool.query(
        `
        SELECT COUNT(*)
        FROM alerts a
        JOIN devices d ON d.id = a.device_id
        WHERE d.vendor_id=$1 AND a.status='Open'
        `,
        [vendorId],
      ),
    ]);

    return {
      totalDevices: Number(devices.rows[0]?.count ?? 0),
      activeDevices: Number(activeDevices.rows[0]?.count ?? 0),
      assignedUsers: Number(users.rows[0]?.count ?? 0),
      todayRevenue: Number(revenueToday.rows[0]?.total ?? 0),
      monthlyRevenue: Number(revenueMonth.rows[0]?.total ?? 0),
      deviceAlerts: Number(alerts.rows[0]?.count ?? 0),
    };
  }

  async listVendorAlerts(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT a.id, a.device_id, a.type, a.status, a.created_at
      FROM alerts a
      JOIN devices d ON d.id = a.device_id
      WHERE d.vendor_id=$1
      ORDER BY a.created_at DESC
      `,
      [vendorId],
    );
    return result.rows.map((row: any) => ({
      id: String(row.id),
      deviceId: String(row.device_id),
      type: String(row.type),
      status: String(row.status),
      createdAt: row.created_at,
    }));
  }

  async listVendorSessions(vendorId: string, filters: {
    startDate?: string;
    endDate?: string;
    deviceId?: string;
    userId?: string;
    status?: string;
  }) {
    const pool = this.postgres.getPool();
    const conditions = ['vendor_id = $1'];
    const values: any[] = [vendorId];
    let index = 2;

    if (filters.status) {
      conditions.push(`status = $${index++}`);
      values.push(filters.status);
    }
    if (filters.deviceId) {
      conditions.push(`device_id = $${index++}`);
      values.push(filters.deviceId);
    }
    if (filters.userId) {
      conditions.push(`user_id = $${index++}`);
      values.push(filters.userId);
    }
    if (filters.startDate) {
      conditions.push(`COALESCE(ended_at, started_at) >= $${index++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`COALESCE(ended_at, started_at) <= $${index++}`);
      values.push(filters.endDate);
    }

    const where = conditions.join(' AND ');
    const result = await pool.query(
      `
      SELECT id, device_id, user_id, status, started_at, ended_at, energy_kwh,
             amount, vendor_amount, close_reason, illegal
      FROM sessions
      WHERE ${where}
      ORDER BY COALESCE(ended_at, started_at) DESC NULLS LAST
      LIMIT 200
      `,
      values,
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      deviceId: String(row.device_id),
      userId: String(row.user_id),
      status: String(row.status),
      startedAt: row.started_at ?? null,
      endedAt: row.ended_at ?? null,
      energyKwh: Number(row.energy_kwh ?? 0),
      amount: Number(row.amount ?? 0),
      vendorAmount: Number(row.vendor_amount ?? 0),
      closeReason: row.close_reason ?? null,
      illegal: Boolean(row.illegal),
    }));
  }

  async listVendorLedger(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT vl.id, vl.session_id, vl.amount, vl.created_at,
             s.device_id, s.user_id, s.status, s.started_at, s.ended_at
      FROM vendor_ledger vl
      LEFT JOIN sessions s ON s.id = vl.session_id
      WHERE vl.vendor_id = $1
      ORDER BY vl.created_at DESC
      `,
      [vendorId],
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      sessionId: row.session_id ? String(row.session_id) : null,
      deviceId: row.device_id ? String(row.device_id) : null,
      userId: row.user_id ? String(row.user_id) : null,
      status: row.status ? String(row.status) : null,
      amount: Number(row.amount ?? 0),
      startedAt: row.started_at ?? null,
      endedAt: row.ended_at ?? null,
      createdAt: row.created_at,
    }));
  }

  async listVendorSettlements(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, amount, status, period_start, period_end, payout_reference, paid_at, created_at
      FROM vendor_settlements
      WHERE vendor_id=$1
      ORDER BY created_at DESC
      `,
      [vendorId],
    );
    return result.rows.map((row: any) => ({
      id: String(row.id),
      amount: Number(row.amount ?? 0),
      status: String(row.status),
      periodStart: row.period_start ?? null,
      periodEnd: row.period_end ?? null,
      payoutReference: row.payout_reference ?? null,
      paidAt: row.paid_at ?? null,
      createdAt: row.created_at,
    }));
  }

  async getSettlementSummary(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) AS paid,
        COALESCE(SUM(CASE WHEN status <> 'PAID' THEN amount ELSE 0 END), 0) AS pending
      FROM vendor_settlements
      WHERE vendor_id = $1
      `,
      [vendorId],
    );
    return {
      total: Number(result.rows[0]?.total ?? 0),
      paid: Number(result.rows[0]?.paid ?? 0),
      pending: Number(result.rows[0]?.pending ?? 0),
    };
  }

  async listVendorUsers(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT u.id, u.phone, u.name,
             MAX(COALESCE(s.ended_at, s.started_at)) AS last_session_at,
             COUNT(s.id) AS total_sessions
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      WHERE s.vendor_id = $1
      GROUP BY u.id
      ORDER BY last_session_at DESC NULLS LAST
      `,
      [vendorId],
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      phone: String(row.phone),
      name: row.name ?? null,
      lastSessionAt: row.last_session_at ?? null,
      totalSessions: Number(row.total_sessions ?? 0),
    }));
  }

  async createDeviceRequest(vendorId: string, payload: {
    deviceId?: string | null;
    stationId?: string | null;
    location?: string | null;
    reason: string;
  }) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `
        INSERT INTO vendor_device_requests (id, vendor_id, device_id, station_id, location, reason)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          id,
          vendorId,
          payload.deviceId ?? null,
          payload.stationId ?? null,
          payload.location ?? null,
          payload.reason,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to create device request: ${String(error)}`);
    }
    return { id };
  }

  async listDeviceRequests(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, device_id, station_id, location, reason, status, created_at
      FROM vendor_device_requests
      WHERE vendor_id=$1
      ORDER BY created_at DESC
      `,
      [vendorId],
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      deviceId: row.device_id ?? null,
      stationId: row.station_id ?? null,
      location: row.location ?? null,
      reason: row.reason ?? null,
      status: row.status ?? null,
      createdAt: row.created_at,
    }));
  }

  async listNotifications(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, channel, title, body, status, created_at
      FROM vendor_notifications
      WHERE vendor_id=$1
      ORDER BY created_at DESC
      `,
      [vendorId],
    );
    return result.rows.map((row: any) => ({
      id: String(row.id),
      channel: String(row.channel),
      title: String(row.title),
      body: String(row.body),
      status: String(row.status),
      createdAt: row.created_at,
    }));
  }

  async markNotificationRead(vendorId: string, id: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `UPDATE vendor_notifications SET status='READ' WHERE id=$1 AND vendor_id=$2`,
        [id, vendorId],
      );
    } catch (error) {
      this.logger.error(`Failed to mark notification read: ${String(error)}`);
    }
  }

  async createSupportTicket(vendorId: string, subject: string, priority: string) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `INSERT INTO support_tickets (id, vendor_id, subject, priority)
         VALUES ($1,$2,$3,$4)`,
        [id, vendorId, subject, priority],
      );
    } catch (error) {
      this.logger.error(`Failed to create support ticket: ${String(error)}`);
    }
    return { id };
  }

  async listSupportTickets(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, subject, status, priority, created_at, updated_at
      FROM support_tickets
      WHERE vendor_id=$1
      ORDER BY updated_at DESC
      `,
      [vendorId],
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      subject: String(row.subject),
      status: String(row.status),
      priority: String(row.priority),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getDeviceVendorId(deviceId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT vendor_id FROM devices WHERE id=$1 LIMIT 1`,
      [deviceId],
    );
    if ((result.rowCount ?? 0) === 0) {
      return null;
    }
    return result.rows[0]?.vendor_id ? String(result.rows[0].vendor_id) : null;
  }

  async createUserAssignment(vendorId: string, userId: string, deviceId: string) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `
        INSERT INTO vendor_user_device_assignments (id, vendor_id, user_id, device_id)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (vendor_id, user_id, device_id) DO NOTHING
        `,
        [id, vendorId, userId, deviceId],
      );
    } catch (error) {
      this.logger.error(`Failed to create user assignment: ${String(error)}`);
    }
    return { id };
  }

  async listUserAssignments(vendorId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT a.id, a.user_id, a.device_id, a.status, a.created_at,
             u.phone, u.name,
             d.status AS device_status
      FROM vendor_user_device_assignments a
      JOIN users u ON u.id = a.user_id
      JOIN devices d ON d.id = a.device_id
      WHERE a.vendor_id = $1
      ORDER BY a.created_at DESC
      `,
      [vendorId],
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      userId: String(row.user_id),
      deviceId: String(row.device_id),
      status: String(row.status),
      userPhone: row.phone ?? null,
      userName: row.name ?? null,
      deviceStatus: row.device_status ?? null,
      createdAt: row.created_at,
    }));
  }

  async updateUserAssignmentStatus(vendorId: string, assignmentId: string, status: string) {
    const pool = this.postgres.getPool();
    try {
      await pool.query(
        `UPDATE vendor_user_device_assignments SET status=$3 WHERE id=$1 AND vendor_id=$2`,
        [assignmentId, vendorId, status],
      );
    } catch (error) {
      this.logger.error(`Failed to update user assignment status: ${String(error)}`);
    }
  }

  async closeSupportTicket(vendorId: string, ticketId: string) {
    const pool = this.postgres.getPool();
    await pool.query(
      `UPDATE support_tickets SET status='CLOSED', updated_at=NOW() WHERE id=$1 AND vendor_id=$2`,
      [ticketId, vendorId],
    );
  }

  async addSupportMessage(params: {
    ticketId: string;
    vendorId: string;
    message: string;
    attachments?: string[] | null;
    senderRole: string;
  }) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `
        INSERT INTO support_ticket_messages (id, ticket_id, vendor_id, sender_role, message, attachments)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          id,
          params.ticketId,
          params.vendorId,
          params.senderRole,
          params.message,
          params.attachments ?? null,
        ],
      );
      await pool.query(`UPDATE support_tickets SET updated_at=NOW() WHERE id=$1`, [
        params.ticketId,
      ]);
    } catch (error) {
      this.logger.error(`Failed to add support message: ${String(error)}`);
    }
    return { id };
  }

  async listSupportMessages(vendorId: string, ticketId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, sender_role, message, attachments, created_at
      FROM support_ticket_messages
      WHERE ticket_id=$1 AND vendor_id=$2
      ORDER BY created_at ASC
      `,
      [ticketId, vendorId],
    );

    return result.rows.map((row: any) => ({
      id: String(row.id),
      senderRole: String(row.sender_role),
      message: String(row.message),
      attachments: row.attachments ?? null,
      createdAt: row.created_at,
    }));
  }
}
