import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'Verification code must contain only digits' })
  code: string;
}
