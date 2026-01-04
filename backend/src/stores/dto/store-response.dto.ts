import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StoreResponseDto {
  @Expose()
  storeId: string;

  @Expose()
  sellerId: string;

  @Expose()
  storeName: string;

  @Expose()
  storeDescription: string | null;

  @Expose()
  storeAddress: string | null;

  @Expose()
  storeEmail: string | null;

  @Expose()
  storePhone: string | null;

  @Expose()
  avatar: string | null;

  @Expose()
  averageRating: number;

  @Expose()
  totalRatings: number;

  @Expose()
  productCount: number;

  @Expose()
  deletedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Relations
  @Expose()
  seller?: any;
}
