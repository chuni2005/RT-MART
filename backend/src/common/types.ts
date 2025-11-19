import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  loginId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}
