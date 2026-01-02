import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

/**
 * UpdateProductDto - 更新商品資料
 * 注意：initialStock 不可更新（庫存應透過 Inventory API 管理）
 */
export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @Length(1, 200)
  productName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  price?: number;

  @IsString()
  @IsOptional()
  productTypeId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
