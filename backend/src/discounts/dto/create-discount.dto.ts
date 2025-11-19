import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DiscountType } from '../entities/discount.entity';

export class SeasonalDiscountDetailsDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  discountRate: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  maxDiscountAmount?: number;
}

export class ShippingDiscountDetailsDto {
  @IsNumber()
  @IsPositive()
  discountAmount: number;
}

export class SpecialDiscountDetailsDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsOptional()
  productTypeId?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  discountRate: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  maxDiscountAmount?: number;
}

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  discountCode: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  minPurchaseAmount: number;

  @IsDate()
  @Type(() => Date)
  startDatetime: Date;

  @IsDate()
  @Type(() => Date)
  endDatetime: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @ValidateIf(
    (o: CreateDiscountDto) => o.discountType === DiscountType.SEASONAL,
  )
  @ValidateNested()
  @Type(() => SeasonalDiscountDetailsDto)
  seasonalDetails?: SeasonalDiscountDetailsDto;

  @ValidateIf(
    (o: CreateDiscountDto) => o.discountType === DiscountType.SHIPPING,
  )
  @ValidateNested()
  @Type(() => ShippingDiscountDetailsDto)
  shippingDetails?: ShippingDiscountDetailsDto;

  @ValidateIf((o: CreateDiscountDto) => o.discountType === DiscountType.SPECIAL)
  @ValidateNested()
  @Type(() => SpecialDiscountDetailsDto)
  specialDetails?: SpecialDiscountDetailsDto;
}
