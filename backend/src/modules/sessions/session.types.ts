export type ReportType = 's' | 'i' | 'f' | 'a';

export interface EnergyDataPayload {
  id: string;
  v?: number;
  p?: number;
  e?: number;
  tpwh?: number;
  up?: number;
  ts: number;
  ct?: string;
  st: number;
  rpt: ReportType;
  ill?: number;
  amt?: number;
  rt?: number;
  sid?: string;
  tr?: string;
}

export type SessionStatus = 'PENDING' | 'ACTIVE' | 'STOPPED';

export interface SessionInit {
  sessionId: string;
  deviceId: string;
  userId: string;
  vendorId: string;
  vehicleType: 'car' | 'bike';
  bookingId?: string;
  pricePerKwh: number;
  platformFeePct: number;
  timerMinutes?: number;
}

export interface SessionRecord extends SessionInit {
  status: SessionStatus;
  startedAt?: Date;
  endedAt?: Date;
  lastTelemetryAt?: Date;
  lastTpwh?: number;
  lastEnergyKwh?: number;
  energyKwh: number;
  amount: number;
  platformAmount: number;
  vendorAmount: number;
  lastDeviceAmount?: number;
  lastDeviceRate?: number;
}
