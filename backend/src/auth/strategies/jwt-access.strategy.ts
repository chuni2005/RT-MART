import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import type { JwtPayload } from '../../common/types';

interface JwtStrategyPayload {
  sub: string;
  loginId: string;
  role: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_SECRET || 'your_access_secret_key',
    });
  }

  async validate(payload: JwtStrategyPayload): Promise<JwtPayload> {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      loginId: payload.loginId,
      role: payload.role,
    };
  }
}