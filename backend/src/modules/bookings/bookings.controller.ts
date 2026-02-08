import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { JwtPayload } from '../../auth/auth.service';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { parseDateTimeValue } from '../../common/date-time';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async create(
    @Req() req: { user?: JwtPayload },
    @Body() input: CreateBookingDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      return { ok: false };
    }

    const startAt = parseDateTimeValue(input.startAt);
    const endAt = parseDateTimeValue(input.endAt);
    if (!startAt || !endAt) {
      throw new BadRequestException('Invalid date/time format');
    }

    return await this.bookingsService.createBooking(
      randomUUID(),
      userId,
      input.deviceId,
      startAt,
      endAt,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  listMine(@Req() req: { user?: JwtPayload }) {
    const userId = req.user?.sub;
    if (!userId) {
      return [];
    }
    return this.bookingsService.listByUser(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAll() {
    return this.bookingsService.listAll().then((rows) =>
      rows.map((row) => ({
        id: row.id,
        deviceId: row.deviceId,
        user: row.userId,
        status: row.status,
        startAt: row.startAt,
        endAt: row.endAt,
      })),
    );
  }

  @Post('expire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  expireNoShows() {
    return this.bookingsService.expireNoShows(new Date());
  }
}
