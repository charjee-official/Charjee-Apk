import { Injectable } from '@nestjs/common';
import { AlertsRepository } from './alerts.repository';

@Injectable()
export class AlertsService {
  constructor(private readonly repository: AlertsRepository) {}

  listAll() {
    return this.repository.listAll();
  }

  resolveAlert(id: string) {
    return this.repository.updateStatus(id, 'Resolved');
  }

  async raiseAlert(deviceId: string, type: string) {
    const exists = await this.repository.hasOpenAlert(deviceId, type);
    if (exists) {
      return;
    }
    await this.repository.createAlert(deviceId, type);
  }
}
