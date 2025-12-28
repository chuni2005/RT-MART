import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { DiscountType } from '../entities/discount.entity';

export class QueryDiscountDto {
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  createdById?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
