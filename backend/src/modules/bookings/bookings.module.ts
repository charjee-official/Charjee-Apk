import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BookingsController],
  providers: [BookingsRepository, BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
