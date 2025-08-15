import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';

@Module({
  imports: [],
  controllers: [VenuesController],
  providers: [],
})
export class VenuesModule {}