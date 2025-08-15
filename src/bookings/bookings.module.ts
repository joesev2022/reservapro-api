import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Venue } from '../venues/venue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Venue])],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
