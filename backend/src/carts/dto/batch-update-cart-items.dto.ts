import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchUpdateItemDto {
  @IsString()
  @IsNotEmpty()
  cartItemId: string;

  @IsBoolean()
  selected: boolean;
}

export class BatchUpdateCartItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItemDto)
  items: BatchUpdateItemDto[];
}
