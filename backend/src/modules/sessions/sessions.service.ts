import { Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../../realtime/realtime.service';
import { RedisService } from '../../database/redis.service';
import { BillingService } from './billing.service';
import { SessionsRepository } from './sessions.repository';
import { BookingsService } from '../bookings/bookings.service';
import { DevicesService } from '../devices/devices.service';
import { AlertsService } from '../alerts/alerts.service';
import {
  EnergyDataPayload,
  SessionInit,
  SessionRecord,
  SessionStatus,
} from './session.types';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly sessionsById = new Map<string, SessionRecord>();
  private readonly activeByDevice = new Map<string, string>();

  constructor(
    private readonly billingService: BillingService,
    private readonly realtimeService: RealtimeService,
    private readonly redisService: RedisService,
    private readonly sessionsRepository: SessionsRepository,
    private readonly bookingsService: BookingsService,
    private readonly devicesService: DevicesService,
    private readonly alertsService: AlertsService,
  ) {}

  async registerSession(init: SessionInit) {
    const record: SessionRecord = {
      ...init,
      status: 'PENDING',
      energyKwh: 0,
      amount: 0,
      platformAmount: 0,
      vendorAmount: 0,
      closeReason: null,
      illegal: false,
    };

    this.sessionsById.set(init.sessionId, record);
    this.activeByDevice.set(init.deviceId, init.sessionId);
    await this.cacheActiveSession(init.deviceId, init.sessionId);
    await this.sessionsRepository.createSession(record);
    this.logger.log(
      `Session registered sessionId=${init.sessionId} deviceId=${init.deviceId}`,
    );
  }

  async handleEnergyData(data: EnergyDataPayload) {
    const sessionId = await this.resolveSessionId(data);
    if (!sessionId) {
      this.logger.warn(`Telemetry without session. deviceId=${data.id}`);
      return;
    }

    const session = this.sessionsById.get(sessionId);
    if (!session) {
      this.logger.warn(`Unknown sessionId=${sessionId} deviceId=${data.id}`);
      return;
    }

    await this.devicesService.markOnline(data.id);
    await this.raiseAlerts(data);

    session.lastTelemetryAt = new Date();
    await this.sessionsRepository.insertTelemetry(sessionId, data);

    if (data.rpt === 's' && data.st === 1) {
      await this.activateSession(session);
    }

    if (data.rpt === 'i' || data.rpt === 's') {
      this.billingService.applyTelemetry(session, data);
      await this.sessionsRepository.updateSession(session);
      this.realtimeService.emitTelemetry(session, data);
      this.realtimeService.emitSessionUpdated(session);
    }

    if (data.rpt === 'f' || data.st === 0) {
      this.billingService.applyTelemetry(session, data);
      await this.stopSession(session, data.rpt, data);
      await this.sessionsRepository.updateSession(session);
      this.realtimeService.emitTelemetry(session, data);
    }
  }

  private async resolveSessionId(
    data: EnergyDataPayload,
  ): Promise<string | undefined> {
    if (data.sid) {
      return data.sid;
    }

    return this.activeByDevice.get(data.id) ?? (await this.getCachedSession(data.id));
  }

  private async activateSession(session: SessionRecord) {
    if (session.status === 'ACTIVE') {
      return;
    }

    session.status = 'ACTIVE';
    session.startedAt = session.startedAt ?? new Date();
    await this.sessionsRepository.updateSession(session);
    this.realtimeService.emitSessionStarted(session);
  }

  private async stopSession(
    session: SessionRecord,
    reason: string,
    data?: EnergyDataPayload,
  ) {
    if (session.status === 'STOPPED') {
      return;
    }

    session.status = 'STOPPED';
    session.endedAt = new Date();
    session.illegal = Boolean(data?.ill && data.ill > 0);
    session.closeReason = this.resolveCloseReason(reason, data);
    this.activeByDevice.delete(session.deviceId);
    await this.clearCachedSession(session.deviceId);
    await this.sessionsRepository.updateSession(session);
    await this.ensureLedgers(session);
    await this.bookingsService.completeBooking(session.bookingId);
    this.logger.log(
      `Session stopped sessionId=${session.sessionId} reason=${reason}`,
    );
    this.realtimeService.emitSessionStopped(session);
  }

  getSession(sessionId: string): SessionRecord | undefined {
    return this.sessionsById.get(sessionId);
  }

  getSessionStatus(sessionId: string): SessionStatus | undefined {
    return this.sessionsById.get(sessionId)?.status;
  }

  async listActiveSessions() {
    const rows = await this.sessionsRepository.listActiveSessions();
    return rows.map((row) => this.toAdminSession(row));
  }

  async listHistorySessions() {
    const rows = await this.sessionsRepository.listHistorySessions();
    return rows.map((row) => this.toAdminSession(row));
  }

  async getAdminSession(sessionId: string) {
    const row = await this.sessionsRepository.getById(sessionId);
    return row ? this.toAdminSession(row) : null;
  }

  async getSessionMeta(sessionId: string) {
    const row = await this.sessionsRepository.getById(sessionId);
    if (!row) {
      return null;
    }
    return {
      sessionId: row.id,
      deviceId: row.device_id,
      status: row.status,
    };
  }

  async listFinanceSessions() {
    const rows = await this.sessionsRepository.listFinanceSessions();
    return rows.map((row) => ({
      id: row.id,
      deviceId: null,
      user: null,
      status: null,
      startTime: row.started_at ?? null,
      startedAt: row.started_at ?? null,
      endedAt: null,
      energyKwh: 0,
      cost: Number(row.amount ?? 0),
      closeReason: null,
      illegal: false,
    }));
  }

  async forceStopSession(sessionId: string) {
    await this.sessionsRepository.forceStop(sessionId);
    const meta = await this.getSessionMeta(sessionId);
    if (meta?.deviceId) {
      this.activeByDevice.delete(meta.deviceId);
      await this.clearCachedSession(meta.deviceId);
    }
    const existing = this.sessionsById.get(sessionId);
    if (existing) {
      existing.status = 'STOPPED';
      existing.endedAt = new Date();
      existing.closeReason = 'Force stop';
    }
    return this.getAdminSession(sessionId);
  }

  private toAdminSession(row: any) {
    const startedAt = row.started_at ?? null;
    const endedAt = row.ended_at ?? null;
    return {
      id: row.id,
      deviceId: row.device_id,
      user: row.user_id,
      status: row.status,
      startTime: startedAt,
      startedAt,
      endedAt,
      energyKwh: Number(row.energy_kwh ?? 0),
      cost: Number(row.amount ?? 0),
      closeReason: row.close_reason ?? (row.status === 'STOPPED' ? 'Normal' : null),
      illegal: Boolean(row.illegal),
    };
  }

  private async ensureLedgers(session: SessionRecord) {
    if (session.amount <= 0) {
      return;
    }

    const hasWallet = await this.sessionsRepository.hasWalletLedger(session.sessionId);
    if (!hasWallet) {
      await this.sessionsRepository.insertWalletLedger(
        session.userId,
        session.sessionId,
        session.amount,
        'Debit',
      );
    }

    const hasVendor = await this.sessionsRepository.hasVendorLedger(session.sessionId);
    if (!hasVendor) {
      await this.sessionsRepository.insertVendorLedger(
        session.vendorId,
        session.sessionId,
        session.vendorAmount,
      );
    }
  }

  private resolveCloseReason(reason: string, data?: EnergyDataPayload) {
    if (data?.ill && data.ill > 0) {
      return 'Illegal consumption';
    }
    if (reason === 'f') {
      return 'Force stop';
    }
    if (data?.st === 0) {
      return 'Device stop';
    }
    return 'Normal';
  }

  private async raiseAlerts(data: EnergyDataPayload) {
    const lowVoltageThreshold = Number(process.env.LOW_VOLTAGE_THRESHOLD ?? 190);
    if (data.ill && data.ill > 0) {
      await this.alertsService.raiseAlert(data.id, 'Illegal consumption');
    }
    if (typeof data.v === 'number' && data.v > 0 && data.v < lowVoltageThreshold) {
      await this.alertsService.raiseAlert(data.id, 'Low voltage');
    }
  }

  private getCachedSession(deviceId: string): Promise<string | undefined> {
    try {
      const client = this.redisService.getClient();
      return client.get(this.activeDeviceKey(deviceId)) ?? Promise.resolve(undefined);
    } catch (error) {
      this.logger.warn('Redis not available for session lookup');
      return Promise.resolve(undefined);
    }
  }

  private async cacheActiveSession(deviceId: string, sessionId: string) {
    try {
      const client = this.redisService.getClient();
      await client.set(this.activeDeviceKey(deviceId), sessionId);
    } catch (error) {
      this.logger.warn('Redis not available for session cache set');
    }
  }

  private async clearCachedSession(deviceId: string) {
    try {
      const client = this.redisService.getClient();
      await client.del(this.activeDeviceKey(deviceId));
    } catch (error) {
      this.logger.warn('Redis not available for session cache delete');
    }
  }

  private activeDeviceKey(deviceId: string) {
    return `session:active:device:${deviceId}`;
  }
}
