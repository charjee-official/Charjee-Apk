import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  private readonly vendorRates = new Map<string, number>([["default", 18]]);

  getActiveRate(vendorId: string, deviceId: string): number {
    return (
      this.vendorRates.get(`${vendorId}:${deviceId}`) ??
      this.vendorRates.get(vendorId) ??
      this.vendorRates.get('default') ??
      0
    );
  }

  setRate(vendorId: string, deviceId: string | undefined, rate: number) {
    const key = deviceId ? `${vendorId}:${deviceId}` : vendorId;
    this.vendorRates.set(key, rate);
  }
}
