import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { EnergyDataPayload, SessionRecord } from '../modules/sessions/session.types';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitTelemetry(session: SessionRecord, data: EnergyDataPayload) {
    const payload = { sessionId: session.sessionId, deviceId: session.deviceId, data };
    this.emitToSessionRooms(session, 'device.telemetry', payload);
  }

  emitSessionStarted(session: SessionRecord) {
    this.emitToSessionRooms(session, 'session.started', session);
  }

  emitSessionUpdated(session: SessionRecord) {
    this.emitToSessionRooms(session, 'session.updated', session);
  }

  emitSessionStopped(session: SessionRecord) {
    this.emitToSessionRooms(session, 'session.stopped', session);
  }

  private emitToSessionRooms(
    session: SessionRecord,
    event: string,
    payload: unknown,
  ) {
    const server = this.gateway.server;
    if (!server) {
      return;
    }

    server.to(`device:${session.deviceId}`).emit(event, payload);
    server.to(`session:${session.sessionId}`).emit(event, payload);
    server.to(`user:${session.userId}`).emit(event, payload);
    server.to(`vendor:${session.vendorId}`).emit(event, payload);
  }
}
