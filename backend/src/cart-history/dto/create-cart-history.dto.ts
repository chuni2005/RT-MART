import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCartHistoryDto {
  @IsObject()
  @IsNotEmpty()
  cartSnapshot: object;

  @IsInt()
  @Min(0)
  itemCount: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  orderIds?: string[];
}
