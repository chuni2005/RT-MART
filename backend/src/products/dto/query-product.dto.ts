import { IsOptional, IsString } from 'class-validator';

export class QueryProductDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  keyword?: string; // Alias for search

  @IsString()
  @IsOptional()
  minRating?: string;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  productTypeId?: string;

  @IsString()
  @IsOptional()
  minPrice?: string;

  @IsString()
  @IsOptional()
  maxPrice?: string;

  @IsString()
  @IsOptional()
  sortBy?: string; // price, rating, views, createdAt

  @IsString()
  @IsOptional()
  sortOrder?: string; // ASC, DESC

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
