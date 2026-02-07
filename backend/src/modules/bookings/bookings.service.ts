import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';

@Injectable()
export class BookingsService {
  constructor(private readonly repository: BookingsRepository) {}

  async createBooking(
    id: string,
    userId: string,
    deviceId: string,
    startAt: Date,
    endAt: Date,
  ) {
    if (endAt <= startAt) {
      throw new BadRequestException('Invalid booking window');
    }

    const conflict = await this.repository.hasConflict(
      deviceId,
      startAt,
      endAt,
    );
    if (conflict) {
      throw new BadRequestException('Device already booked for this time');
    }

    return this.repository.create({
      id,
      userId,
      deviceId,
      startAt,
      endAt,
      status: 'BOOKED',
    });
  }

  listByUser(userId: string) {
    return this.repository.listByUser(userId);
  }

  async claimBooking(
    userId: string,
    deviceId: string,
    at: Date,
    bookingId?: string,
  ) {
    const graceMinutes = Number(process.env.BOOKING_GRACE_MINUTES ?? 5);
    const graceMs = Number.isFinite(graceMinutes) ? graceMinutes * 60_000 : 300_000;
    const atMinusGrace = new Date(at.getTime() - graceMs);

    const booking = await this.repository.getActiveBooking(
      userId,
      deviceId,
      at,
      atMinusGrace,
    );
    if (!booking) {
      return null;
    }

    if (bookingId && booking.id !== bookingId) {
      return null;
    }

    await this.repository.markActive(booking.id);
    return booking;
  }

  async completeBooking(bookingId?: string) {
    if (!bookingId) {
      return;
    }
    await this.repository.markCompleted(bookingId);
  }

  async expireNoShows(now: Date) {
    const graceMinutes = Number(process.env.BOOKING_GRACE_MINUTES ?? 5);
    const graceMs = Number.isFinite(graceMinutes) ? graceMinutes * 60_000 : 300_000;
    const cutoff = new Date(now.getTime() - graceMs);
    return this.repository.expireNoShows(cutoff);
  }
}
