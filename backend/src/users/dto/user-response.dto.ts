import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  userId: string;

  @Expose()
  loginId: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  phoneNumber: string | null;

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt: Date | null;
}
