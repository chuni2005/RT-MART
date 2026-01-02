import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateOrderFromSnapshotDto {
  @IsObject()
  @IsNotEmpty()
  cartSnapshot: any;

  @IsObject()
  @IsNotEmpty()
  shippingAddressSnapshot: any;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  shippingDiscountCode?: string;

  @IsString()
  @IsOptional()
  productDiscountCode?: string;
}
