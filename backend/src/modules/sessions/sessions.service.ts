import { Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../../realtime/realtime.service';
import { RedisService } from '../../database/redis.service';
import { BillingService } from './billing.service';
import { SessionsRepository } from './sessions.repository';
import { BookingsService } from '../bookings/bookings.service';
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
  ) {}

  async registerSession(init: SessionInit) {
    const record: SessionRecord = {
      ...init,
      status: 'PENDING',
      energyKwh: 0,
      amount: 0,
      platformAmount: 0,
      vendorAmount: 0,
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
      await this.stopSession(session, data.rpt);
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

  private async stopSession(session: SessionRecord, reason: string) {
    if (session.status === 'STOPPED') {
      return;
    }

    session.status = 'STOPPED';
    session.endedAt = new Date();
    this.activeByDevice.delete(session.deviceId);
    await this.clearCachedSession(session.deviceId);
    await this.sessionsRepository.updateSession(session);
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
