import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { WalletRepository } from './wallet.repository';

type VehicleType = 'car' | 'bike';

@Injectable()
export class WalletService {
  private readonly balances = new Map<string, number>();

  constructor(
    private readonly settingsService: SettingsService,
    private readonly repository: WalletRepository,
  ) {}

  getBalance(userId: string): number {
    return this.balances.get(userId) ?? 0;
  }

  async ensureMinimumBalance(userId: string, vehicleType: VehicleType) {
    const balance = this.getBalance(userId);
    const settings = await this.settingsService.getSettings();
    const required =
      vehicleType === 'car' ? settings.minWalletCar : settings.minWalletBike;
    if (balance < required) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required minimum is ${required}.`,
      );
    }
  }

  setBalance(userId: string, amount: number) {
    this.balances.set(userId, amount);
  }

  async listTransactions() {
    const rows = await this.repository.listTransactions();
    return rows.map((row) => ({
      id: row.id,
      user: row.userId,
      sessionId: row.sessionId ?? '-',
      amount: row.amount,
      type: row.type,
      reason: '-',
      createdAt: row.createdAt,
    }));
  }
}
