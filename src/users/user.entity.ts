import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

export type UserRole = 'admin' | 'trabajador' | 'cliente';

@Entity()
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() name: string;

  @Column() email: string;

  @Column() passwordHash: string;

  @Column({ type: 'text', default: 'cliente' })
  role: UserRole;
}