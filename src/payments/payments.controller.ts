import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  // crear preferencia
  @Post('checkout')
  @Roles('admin','trabajador','cliente')
  createPref(@Body('bookingId') bookingId: string) {
    return this.svc.createPreference(bookingId);
  }

  // verificación después del redirect (desde el front)
  @Get('verify')
  @Roles('admin','trabajador','cliente')
  verify(@Query('payment_id') paymentId?: string, @Query('preference_id') prefId?: string) {
    if (paymentId) {
      return this.svc.verifyByPaymentId(paymentId);
    }
    if (prefId) {
      return this.svc.verifyByPreferenceId(prefId);
    }
    return { approved: false, reason: 'No payment_id' };
  }
}
