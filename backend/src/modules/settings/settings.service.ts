import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  getSettings() {
    return this.repository.getSettings();
  }

  async updateSettings(update: {
    platformFeePct?: number;
    minWalletCar?: number;
    minWalletBike?: number;
    bookingsEnabled?: boolean;
  }) {
    await this.repository.updateSettings(update);
    return this.getSettings();
  }
}
