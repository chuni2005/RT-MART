import { IsArray, IsPositive, IsString } from 'class-validator';

export class UpdateSortedReviewImagesDto {
  @IsString()
  reviewImageId: string;

  @IsPositive()
  order: number;
}

export class SortReviewImagesDto {
  @IsArray()
  reviewImages: UpdateSortedReviewImagesDto[];
}
