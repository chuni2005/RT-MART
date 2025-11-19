import { Request } from 'express';
import { UserRole } from '../../users/entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  loginId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}
