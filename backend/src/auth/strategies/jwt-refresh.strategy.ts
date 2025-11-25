import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type {
  AuthenticatedUser,
  CookieRequest,
} from '../../common/types/request.types';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: CookieRequest) => req?.cookies?.['refreshToken'],
      ]),
      secretOrKey: process.env.REFRESH_SECRET!,
      passReqToCallback: true,
    });
  }

  validate(req: CookieRequest, payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      loginId: payload.loginId,
      role: payload.role as UserRole,
    };
  }
}
