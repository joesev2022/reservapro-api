import { IsUUID, IsISO8601, Validate } from 'class-validator';

export class CreateBookingDto {
  @IsUUID() venueId: string;
  @IsISO8601() startAt: string; // ISO UTC
  @IsISO8601() endAt: string;
}