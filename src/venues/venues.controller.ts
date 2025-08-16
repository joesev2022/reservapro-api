import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { VenuesService } from './venues.service';

@Controller('venues')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VenuesController {

  constructor(private svc: VenuesService) {}

  @Get('admin-stats')
  @Roles('admin')
  getAdminStats() {
    return { ok: true, onlyFor: 'admin' };
  }

  @Get()
  @Roles('admin','trabajador','cliente')
  findAll() { return this.svc.findAll() }
}