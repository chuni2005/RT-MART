import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * UpdateShippingAddressDto - 更新配送地址
 * 所有欄位皆為可選，僅更新提供的欄位
 */
export class UpdateShippingAddressDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  recipientName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'phone must be a valid phone number format',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  city?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  district?: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @Length(1, 255)
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @Length(1, 255)
  addressLine2?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
