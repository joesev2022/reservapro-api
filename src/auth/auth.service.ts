import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(name: string, email: string, password: string, role: User['role']='cliente') {
    const exist = await this.usersRepo.findOne({ where: { email } });
    if (exist) throw new ConflictException('Email en uso');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ name, email, passwordHash, role });
    await this.usersRepo.save(user);
    return this.sign(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.sign(user);
  }

  private sign(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwt.sign(payload), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}
