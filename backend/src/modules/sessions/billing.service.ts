import { Injectable } from '@nestjs/common';
import { EnergyDataPayload, SessionRecord } from './session.types';

@Injectable()
export class BillingService {
  applyTelemetry(session: SessionRecord, data: EnergyDataPayload) {
    const next = this.getEnergyKwh(data);
    if (next === undefined) {
      return;
    }

    const delta = this.getDeltaKwh(session, next, data);
    if (delta <= 0) {
      session.lastEnergyKwh = next;
      session.lastTpwh = data.tpwh ?? session.lastTpwh;
      return;
    }

    session.energyKwh += delta;
    session.amount += delta * session.pricePerKwh;
    session.platformAmount = session.amount * (session.platformFeePct / 100);
    session.vendorAmount = session.amount - session.platformAmount;
    session.lastEnergyKwh = next;
    session.lastTpwh = data.tpwh ?? session.lastTpwh;
    session.lastDeviceAmount = data.amt;
    session.lastDeviceRate = data.rt;
  }

  private getEnergyKwh(data: EnergyDataPayload): number | undefined {
    if (typeof data.tpwh === 'number') {
      return data.tpwh / 1000;
    }

    if (typeof data.e === 'number') {
      return data.e;
    }

    return undefined;
  }

  private getDeltaKwh(
    session: SessionRecord,
    next: number,
    data: EnergyDataPayload,
  ): number {
    if (typeof data.tpwh === 'number' && typeof session.lastTpwh === 'number') {
      return Math.max(0, data.tpwh / 1000 - session.lastTpwh / 1000);
    }

    if (typeof session.lastEnergyKwh === 'number') {
      return Math.max(0, next - session.lastEnergyKwh);
    }

    return 0;
  }
}
