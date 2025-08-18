import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { Venue } from '../venues/venue.entity';
import { BookingsGateway } from './bookings.gateway';
import { JwtUser } from 'src/auth/current-user.decorator';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly repo: Repository<Booking>,
    @InjectRepository(Venue) private readonly venues: Repository<Venue>,
    private readonly ws: BookingsGateway,
  ) {}

  async list(user: JwtUser, params: { from?: Date; to?: Date; venueId?: string }) {
    /* const where: any = {};
    if (params.venueId) where.venue = { id: params.venueId }; */

    // Si hay rango, devolvemos reservas que intersecten el rango
    /* if (params.from && params.to) {
      // Intersección: !(end <= from || start >= to)
      return this.repo.createQueryBuilder('b')
        .leftJoinAndSelect('b.venue','v')
        .where(params.venueId ? 'v.id = :venueId' : '1=1', { venueId: params.venueId })
        .andWhere('NOT (b."endAt" <= :from OR b."startAt" >= :to)', { from: params.from, to: params.to })
        .orderBy('b."startAt"', 'ASC')
        .getMany();
    } */

    /* return this.repo.find({ where, order: { startAt: 'ASC' } }); */
    const qb = this.repo.createQueryBuilder('b')
      .leftJoinAndSelect('b.venue', 'v')   // venue eager, pero por si acaso
      .leftJoinAndSelect('b.user', 'u')    // necesitamos saber el dueño
      .orderBy('b."startAt"', 'ASC');

    if (params.venueId) qb.andWhere('v.id = :venueId', { venueId: params.venueId });
    if (params.from && params.to) {
      qb.andWhere('NOT (b."endAt" <= :from OR b."startAt" >= :to)', { from: params.from, to: params.to });
    }

    // 👇 clientes solo ven sus reservas
    if (user.role === 'cliente') qb.andWhere('u.id = :uid', { uid: user.userId });

    return qb.getMany();
  }

  async create(user: JwtUser, input: { venueId: string; startAt: Date; endAt: Date; title?: string }) {
    if (input.endAt <= input.startAt) {
      throw new BadRequestException('Rango inválido');
    }
    const venue = await this.venues.findOne({ where: { id: input.venueId } });
    if (!venue) throw new NotFoundException('Venue no existe');

    await this.ensureNoOverlap(venue.id, input.startAt, input.endAt);

    const saved = await this.repo.save(this.repo.create({ venue, user: { id: user.userId } as any, startAt: input.startAt, endAt: input.endAt, title: input.title }));
    this.ws.emitCreated({ id: saved.id, venueId: venue.id, userId: user.userId, startAt: saved.startAt, endAt: saved.endAt, title: saved.title });
    return saved;
  }

  async update(user: JwtUser, id: string, patch: { startAt?: Date; endAt?: Date; title?: string }) {
    const b = await this.repo.findOne({ where: { id }, relations: ['venue', 'user'] });
    if (!b) throw new NotFoundException('Reserva no existe');

    // 👇 clientes solo pueden editar sus reservas
    if (user.role === 'cliente' && b.user?.id !== user.userId) {
      throw new ForbiddenException('No puedes modificar esta reserva');
    }

    const start = patch.startAt ?? b.startAt;
    const end   = patch.endAt   ?? b.endAt;
    if (end <= start) throw new BadRequestException('Rango inválido');

    await this.ensureNoOverlap(b.venue.id, start, end, b.id);

    b.startAt = start; b.endAt = end;
    if (patch.title !== undefined) b.title = patch.title;
    const res = await this.repo.save(b);
    this.ws.emitUpdated({ id: res.id, venueId: res.venue.id, startAt: res.startAt, endAt: res.endAt, title: res.title });
    return res;
  }

  async remove(user: JwtUser, id: string) {
    const b = await this.repo.findOne({ where: { id }, relations: ['venue', 'user'] });
    if (!b) throw new NotFoundException('Reserva no existe');

    // 👇 clientes solo pueden borrar sus reservas
    if (user.role === 'cliente' && b.user?.id !== user.userId) {
      throw new ForbiddenException('No puedes eliminar esta reserva');
    }

    await this.repo.remove(b);
    this.ws.emitDeleted({ id, venueId: b.venue.id });
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
