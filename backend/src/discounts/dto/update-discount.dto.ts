import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  SeasonalDiscountDetailsDto,
  ShippingDiscountDetailsDto,
  SpecialDiscountDetailsDto,
} from './create-discount.dto';

/**
 * UpdateDiscountDto - 更新折扣資料
 * 注意：discountCode 和 discountType 不可更新（業務邏輯限制）
 */
export class UpdateDiscountDto {
  @IsString()
  @IsOptional()
  @Length(1, 200)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minPurchaseAmount?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDatetime?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDatetime?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @ValidateIf((o: UpdateDiscountDto) => o.seasonalDetails !== undefined)
  @ValidateNested()
  @IsOptional()
  @Type(() => SeasonalDiscountDetailsDto)
  seasonalDetails?: SeasonalDiscountDetailsDto;

  @ValidateIf((o: UpdateDiscountDto) => o.shippingDetails !== undefined)
  @ValidateNested()
  @IsOptional()
  @Type(() => ShippingDiscountDetailsDto)
  shippingDetails?: ShippingDiscountDetailsDto;

  @ValidateIf((o: UpdateDiscountDto) => o.specialDetails !== undefined)
  @ValidateNested()
  @IsOptional()
  @Type(() => SpecialDiscountDetailsDto)
  specialDetails?: SpecialDiscountDetailsDto;
}
