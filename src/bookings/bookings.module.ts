import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Venue } from '../venues/venue.entity';
import { JwtModule } from '@nestjs/jwt';
import { BookingsGateway } from './bookings.gateway';
import { User } from 'src/users/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Venue, User]),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'devsecret' }),
    AuthModule,
  ],
  providers: [BookingsService, BookingsController, BookingsGateway],
  controllers: [BookingsController],
  exports: [BookingsGateway],
})
export class BookingsModule {}
