import { BaseLoader } from './base.loader';
import { Review } from '../../review/entities/review.entity';
import { ReviewImage } from '../../review/entities/review-image.entity';

export class ReviewImageLoader extends BaseLoader<ReviewImage> {
  protected entityName = 'ReviewImage';
  protected jsonFileName = ''; // 不使用 JSON 檔案，直接從資料庫讀取已有的評價
  protected entityClass = ReviewImage;

  private mockImages = [
    'https://picsum.photos/400/400?random=201',
    'https://picsum.photos/400/400?random=202',
    'https://picsum.photos/400/400?random=203',
    'https://picsum.photos/400/400?random=204',
    'https://picsum.photos/400/400?random=205',
  ];

  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }>;
  }> {
    const startTime = Date.now();
    this.logger.log(`Starting to load ${this.entityName}...`);

    // 取得現有的評價
    const reviews = await this.entityManager.find(Review);
    const images: ReviewImage[] = [];

    for (const review of reviews) {
      // 50% 機率有圖片，隨機 1-3 張
      if (Math.random() > 0.5) {
        const numImages = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numImages; i++) {
          const image = new ReviewImage();
          image.reviewId = review.reviewId;
          image.imageUrl =
            this.mockImages[Math.floor(Math.random() * this.mockImages.length)];
          image.displayOrder = i + 1;
          images.push(image);
        }
      }
    }

    let success = 0;
    if (images.length > 0) {
      const saved = await this.entityManager.save(ReviewImage, images);
      success = saved.length;
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Completed loading ${this.entityName}: ${success} inserted (${duration}ms)`,
    );

    return { success, skipped: 0, errors: [] };
  }

  protected validateAndTransform(): Promise<ReviewImage | null> {
    return Promise.resolve(null); // 不使用此方法
  }

  protected checkExists(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
