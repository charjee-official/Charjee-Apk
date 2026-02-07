import { BadRequestException, Injectable } from '@nestjs/common';

type VehicleType = 'car' | 'bike';

@Injectable()
export class WalletService {
  private readonly balances = new Map<string, number>();
  private readonly minBalance: Record<VehicleType, number> = {
    car: 700,
    bike: 300,
  };

  getBalance(userId: string): number {
    return this.balances.get(userId) ?? 0;
  }

  ensureMinimumBalance(userId: string, vehicleType: VehicleType) {
    const balance = this.getBalance(userId);
    const required = this.minBalance[vehicleType];
    if (balance < required) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required minimum is ${required}.`,
      );
    }
  }

  setBalance(userId: string, amount: number) {
    this.balances.set(userId, amount);
  }
}
