import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  cartSnapshot: {};
  shippingAddressSnapshot: any;
}
