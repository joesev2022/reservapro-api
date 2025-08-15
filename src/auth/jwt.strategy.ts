import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_SECRET', 'devsecret');
    console.log('[JWT] usando secreto:', secret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.get<string>('JWT_SECRET', 'devsecret'),
    });
  }
  async validate(payload: any) {
    // payload: { sub: userId, email, role }
    console.log('[JWT] payload:', payload);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
