import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Venue } from '../venues/venue.entity';
import { JwtModule } from '@nestjs/jwt';
import { BookingsGateway } from './bookings.gateway';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Venue, User]),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'devsecret' }),
  ],
  providers: [BookingsService, BookingsController, BookingsGateway],
  controllers: [BookingsController],
})
export class BookingsModule {}
