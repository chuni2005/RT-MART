import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * UpdateStoreDto - 更新商店資料
 * 所有欄位皆為可選，僅更新提供的欄位
 */
export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  @Length(1, 200)
  storeName?: string;

  @IsString()
  @IsOptional()
  storeDescription?: string;

  @IsString()
  @IsOptional()
  storeAddress?: string;

  @IsEmail()
  @IsOptional()
  storeEmail?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'storePhone must be a valid phone number format',
  })
  storePhone?: string;
}
