import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

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

  @IsString()
  @IsOptional()
  bankAccountReference?: string;
}
