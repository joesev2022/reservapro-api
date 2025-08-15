import { IsISO8601, IsOptional } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional() @IsISO8601() startAt?: string;
  @IsOptional() @IsISO8601() endAt?: string;
  // status y title si luego quieres mover/cancelar/renombrar
}