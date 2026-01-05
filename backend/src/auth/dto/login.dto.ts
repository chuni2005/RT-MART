import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be loginId or email

  @IsString()
  @IsNotEmpty()
  password: string;
}
