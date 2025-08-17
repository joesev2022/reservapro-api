import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Booking } from '../bookings/booking.entity';

@Entity()
export class Venue {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true }) name: string;

  @Column('double precision', { nullable: true }) lat?: number;
  @Column('double precision', { nullable: true }) lng?: number;

  @OneToMany(() => Booking, b => b.venue) bookings: Booking[];
}