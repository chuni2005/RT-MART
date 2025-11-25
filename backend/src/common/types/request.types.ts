import { Request } from 'express';
import { UserRole } from '../../users/entities/user.entity';

export interface AuthenticatedUser {
  userId: string;
  loginId: string;
  role: UserRole;
}

export interface CookieRequest extends Request {
  cookies: {
    [key: string]: string;
  };
}

export interface AuthRequest extends CookieRequest {
  user: AuthenticatedUser;
}
