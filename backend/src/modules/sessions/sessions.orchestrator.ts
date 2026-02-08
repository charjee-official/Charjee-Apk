import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MqttService } from '../../mqtt/mqtt.service';
import { BookingsService } from '../bookings/bookings.service';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import { StartSessionDto } from './dto/start-session.dto';
import { StopSessionDto } from './dto/stop-session.dto';
import { SessionsService } from './sessions.service';
import { SessionRecord } from './session.types';

@Injectable()
export class SessionsOrchestrator {
  constructor(
    private readonly pricingService: PricingService,
    private readonly walletService: WalletService,
    private readonly settingsService: SettingsService,
    private readonly sessionsService: SessionsService,
    private readonly mqttService: MqttService,
    private readonly bookingsService: BookingsService,
  ) {}

  async startSession(input: StartSessionDto): Promise<SessionRecord> {
    await this.walletService.ensureMinimumBalance(input.userId, input.vehicleType);

    const settings = await this.settingsService.getSettings();

    const booking = await this.bookingsService.claimBooking(
      input.userId,
      input.deviceId,
      new Date(),
      input.bookingId,
    );
    if (!booking && input.bookingId) {
      throw new BadRequestException('Booking not active for this device');
    }

    const pricePerKwh = this.pricingService.getActiveRate(
      input.vendorId,
      input.deviceId,
    );

    const sessionId = randomUUID();
    const platformFeePct = settings.platformFeePct;

    await this.sessionsService.registerSession({
      sessionId,
      deviceId: input.deviceId,
      userId: input.userId,
      vendorId: input.vendorId,
      vehicleType: input.vehicleType,
      bookingId: booking?.id,
      pricePerKwh,
      platformFeePct,
      timerMinutes: input.timerMinutes,
    });

    const timer = `${input.timerMinutes}m`;
    this.mqttService.publishTurnOn(input.deviceId, timer, sessionId);

    const record = this.sessionsService.getSession(sessionId);
    if (!record) {
      throw new BadRequestException('Session creation failed');
    }

    return record;
  }

  stopSession(input: StopSessionDto): SessionRecord {
    const session = this.sessionsService.getSession(input.sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.deviceId !== input.deviceId) {
      throw new BadRequestException('Device mismatch for session');
    }

    const timerMinutes = input.timerMinutes ?? session.timerMinutes ?? 0;
    const timer = `${timerMinutes}m`;
    this.mqttService.publishTurnOff(input.deviceId, timer, input.sessionId);

    return session;
  }

  async forceStopSession(sessionId: string) {
    const meta = await this.sessionsService.getSessionMeta(sessionId);
    if (!meta) {
      throw new BadRequestException('Session not found');
    }

    const timer = '0m';
    this.mqttService.publishTurnOff(meta.deviceId, timer, sessionId);
    return this.sessionsService.forceStopSession(sessionId);
  }
}
