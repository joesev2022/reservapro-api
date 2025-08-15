import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Venue } from '../venues/venue.entity';

export type BookingStatus = 'pending' | 'paid' | 'cancelled';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Venue, v => v.bookings, { eager: true, onDelete: 'CASCADE' })
  venue: Venue;

  @Column({ type: 'timestamptz' }) startAt: Date; // UTC
  @Column({ type: 'timestamptz' }) endAt: Date;   // UTC

  @Column({ type: 'text', default: 'pending' }) status: BookingStatus;

  @Column({ nullable: true }) title?: string; // opcional (mostrar en calendario)

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}