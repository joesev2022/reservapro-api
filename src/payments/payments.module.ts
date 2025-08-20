import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { BookingsGateway } from 'src/bookings/bookings.gateway';
import { BookingsModule } from 'src/bookings/bookings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), BookingsModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
