import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from './venue.entity';
@Injectable()
export class VenuesService {
  constructor(@InjectRepository(Venue) private repo: Repository<Venue>) {}
  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }
}