import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venue } from './venue.entity';
import { VenuesService } from './venues.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venue])],
  controllers: [VenuesController],
  providers: [VenuesService],
})
export class VenuesModule {}