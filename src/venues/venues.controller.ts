import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('venues')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VenuesController {
  @Get('admin-stats')
  @Roles('admin')
  getAdminStats() {
    return { ok: true, onlyFor: 'admin' };
  }
}