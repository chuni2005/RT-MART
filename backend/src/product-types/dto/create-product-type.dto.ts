import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateProductTypeDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'typeCode can only contain letters, numbers, hyphens, and underscores',
  })
  typeCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  typeName: string;

  @IsString()
  @IsOptional()
  parentTypeId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
