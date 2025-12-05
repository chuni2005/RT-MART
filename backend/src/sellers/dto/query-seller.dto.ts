import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QuerySellerDto {
  @IsString()
  @IsOptional()
  loginId?: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  verified?: boolean;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
