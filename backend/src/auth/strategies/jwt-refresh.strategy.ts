import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refreshToken'],
      ]),
      secretOrKey: process.env.REFRESH_SECRET!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    return payload; 
  }
}
