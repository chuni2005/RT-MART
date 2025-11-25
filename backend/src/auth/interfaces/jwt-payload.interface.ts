export interface JwtPayload {
  sub: string;
  loginId: string;
  role: string;
  iat?: number;
  exp?: number;
}
