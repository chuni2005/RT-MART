import { IsNotEmpty, IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DiscountCodesDto {
  @IsString()
  @IsOptional()
  shipping?: string;

  @IsString()
  @IsOptional()
  product?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  shippingAddressId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DiscountCodesDto)
  discountCodes?: DiscountCodesDto;
}
