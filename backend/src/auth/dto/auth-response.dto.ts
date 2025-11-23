import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../users/entities/user.entity';

@Exclude()
export class AuthResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  user: {
    userId: string;
    loginId: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export class AuthTokenResponseDto {
  @Expose() refreshToken: string;
  @Expose() accessToken: string;
}