import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { Venue } from '../venues/venue.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly repo: Repository<Booking>,
    @InjectRepository(Venue) private readonly venues: Repository<Venue>,
  ) {}

  async list(params: { from?: Date; to?: Date; venueId?: string }) {
    const where: any = {};
    if (params.venueId) where.venue = { id: params.venueId };

    // Si hay rango, devolvemos reservas que intersecten el rango
    if (params.from && params.to) {
      // Intersección: !(end <= from || start >= to)
      return this.repo.createQueryBuilder('b')
        .leftJoinAndSelect('b.venue','v')
        .where(params.venueId ? 'v.id = :venueId' : '1=1', { venueId: params.venueId })
        .andWhere('NOT (b."endAt" <= :from OR b."startAt" >= :to)', { from: params.from, to: params.to })
        .orderBy('b."startAt"', 'ASC')
        .getMany();
    }

    return this.repo.find({ where, order: { startAt: 'ASC' } });
  }

  async create(input: { venueId: string; startAt: Date; endAt: Date; title?: string }) {
    if (input.endAt <= input.startAt) {
      throw new BadRequestException('Rango inválido');
    }
    const venue = await this.venues.findOne({ where: { id: input.venueId } });
    if (!venue) throw new NotFoundException('Venue no existe');

    await this.ensureNoOverlap(venue.id, input.startAt, input.endAt);

    const booking = this.repo.create({ venue, startAt: input.startAt, endAt: input.endAt, title: input.title });
    return this.repo.save(booking);
  }

  async update(id: string, patch: { startAt?: Date; endAt?: Date; title?: string }) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Reserva no existe');

    const start = patch.startAt ?? b.startAt;
    const end   = patch.endAt   ?? b.endAt;
    if (end <= start) throw new BadRequestException('Rango inválido');

    await this.ensureNoOverlap(b.venue.id, start, end, b.id);

    b.startAt = start; b.endAt = end;
    if (patch.title !== undefined) b.title = patch.title;
    return this.repo.save(b);
  }

  async remove(id: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException();
    await this.repo.remove(b);
    return { ok: true };
  }

  private async ensureNoOverlap(venueId: string, start: Date, end: Date, ignoreId?: string) {
    const qb = this.repo.createQueryBuilder('b')
      .where('b."venueId" = :venueId', { venueId })
      .andWhere('NOT (b."endAt" <= :start OR b."startAt" >= :end)', { start, end });

    if (ignoreId) qb.andWhere('b.id <> :ignoreId', { ignoreId });

    const exists = await qb.getCount();
    if (exists > 0) throw new BadRequestException('Horario no disponible (solape)');
  }
}
