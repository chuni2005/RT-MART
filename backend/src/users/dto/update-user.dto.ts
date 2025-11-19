import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * UpdateUserDto - 更新使用者資料
 * 注意：loginId, password, role 不可透過此 DTO 更新（需使用專用 API）
 */
export class UpdateUserDto {
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
  phoneNumber?: string;
}
