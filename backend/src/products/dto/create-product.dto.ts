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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  productName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  productTypeId: string;

  @Type(() => Number)
  @IsOptional()
  @Min(0)
  initialStock?: number;
}
