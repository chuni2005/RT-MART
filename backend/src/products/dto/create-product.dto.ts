import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  displayOrder?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  productName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  productTypeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  initialStock?: number;
}
