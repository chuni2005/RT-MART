import {
  IsEmail,
  IsOptional,
  IsEnum,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

/**
 * UpdateUserDto - 更新使用者資料
 * 注意：loginId, password, role 不可透過此 DTO 更新（需使用專用 API）
 */
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'loginId can only contain letters, numbers, and underscores',
  })
  loginId: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'phoneNumber must be a valid phone number format',
  })
  phone?: string;
}
