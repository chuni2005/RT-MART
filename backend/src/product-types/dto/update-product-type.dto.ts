import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

/**
 * UpdateProductTypeDto - 更新商品類型
 * 注意：typeCode 不可更新（作為唯一識別碼）
 */
export class UpdateProductTypeDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  typeName?: string;

  @IsString()
  @IsOptional()
  parentTypeId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
