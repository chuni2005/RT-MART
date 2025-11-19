import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'phone must be a valid phone number format',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  city: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  district?: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  addressLine1: string;

  @IsString()
  @IsOptional()
  @Length(1, 255)
  addressLine2?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
