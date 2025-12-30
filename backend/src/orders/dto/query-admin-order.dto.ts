import { IsString, IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class QueryAdminOrderDto {
  @IsString()
  @IsOptional()
  search?: string; // order_number, buyer name, seller name, store name

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
