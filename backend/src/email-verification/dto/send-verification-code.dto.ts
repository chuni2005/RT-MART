import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { VerificationPurpose } from '../entities/email-verification.entity';

export class SendVerificationCodeDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Login ID must be at least 3 characters long' })
  @MaxLength(50, { message: 'Login ID must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Login ID can only contain letters, numbers, and underscores',
  })
  loginId: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]+$/, { message: 'Invalid phone number format' })
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(VerificationPurpose)
  purpose?: VerificationPurpose;
}
