import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('overview')
  @Roles('admin','trabajador') // el cliente no necesita ver KPIs
  async overview(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('venueId') venueId?: string,
  ) {
    return this.svc.overview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      venueId: venueId || null,
    });
  }
}