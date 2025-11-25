import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { AuthenticatedUser } from '../../common/types/request.types';
import type { CookieRequest } from '../../common/types/request.types';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: CookieRequest) => req?.cookies?.['accessToken'],
      ]),
      secretOrKey: process.env.ACCESS_SECRET!,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      loginId: payload.loginId,
      role: payload.role as UserRole,
    };
  }
}
