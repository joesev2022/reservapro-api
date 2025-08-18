import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtUser } from 'src/auth/current-user.decorator';

@Controller('bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  // Admin y trabajador ven todo; cliente podría ver solo las suyas si luego agregas userId
  // ✔ todos listan, cliente solo ve las suyas (service filtra)
  @Get()
  @Roles('admin','trabajador','cliente')
  async list(
    @CurrentUser() user: JwtUser,
    @Query('from') from?: string, 
    @Query('to') to?: string, 
    @Query('venueId') venueId?: string
  ) {
    return this.svc.list(user, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      venueId,
    });
  }

  @Post()
  @Roles('admin','trabajador','cliente')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateBookingDto) {
    return this.svc.create(user, {
      venueId: dto.venueId,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
    });
  }

  @Patch(':id')
  @Roles('admin','trabajador')
  async update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.svc.update(user, id, {
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt:   dto.endAt   ? new Date(dto.endAt)   : undefined,
      // title opcional si lo agregas
    });
  }

  @Delete(':id')
  @Roles('admin','trabajador')
  async remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.remove(user, id);
  }
}
