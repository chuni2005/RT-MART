import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryReviewDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  @IsIn(['rating', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order?: string;
}
