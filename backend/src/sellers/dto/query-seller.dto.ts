import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SellerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class QuerySellerDto {
  @IsString()
  @IsOptional()
  loginId?: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  verified?: boolean;

  @IsEnum(SellerStatus)
  @IsOptional()
  status?: SellerStatus;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
