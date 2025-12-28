import { IsArray, IsPositive, IsString } from 'class-validator';

export class UpdateSortedImagesDto {
  @IsString()
  imageId: string;

  @IsPositive()
  order: number;
}

export class SortImagesDto {
  @IsArray()
  images: UpdateSortedImagesDto[];
}
