import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Venue } from '../venues/venue.entity';
import { User } from 'src/users/user.entity';

export type BookingStatus = 'pending' | 'paid' | 'cancelled';
@Index('idx_booking_start_at', ['startAt'])
@Index('idx_booking_venue', ['venue'])
@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Venue, v => v.bookings, { eager: true, onDelete: 'CASCADE' })
  venue: Venue;

    // 👇 dueño de la reserva (para permisos)
  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  user: User | null;

  @Column({ type: 'timestamptz' }) startAt: Date; // UTC
  @Column({ type: 'timestamptz' }) endAt: Date;   // UTC

  @Column({ type: 'text', default: 'pending' }) status: BookingStatus;

  @Column('numeric', { precision: 10, scale: 2, default: 20 }) amount: string;
  @Column({ default: 'PEN' }) currency: string;

  @Column({ nullable: true }) title?: string; // opcional (mostrar en calendario)

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}