import { BaseLoader } from './base.loader';
import { Review } from '../../review/entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export class ReviewLoader extends BaseLoader<Review> {
  protected entityName = 'Review';
  protected jsonFileName = 'ecommerce_product_data.json';
  protected entityClass = Review;

  private reviewComments = [
    '非常棒的商品，品質超乎預期！',
    '出貨速度很快，包裝也很細心。',
    'CP值很高，推薦給大家。',
    '使用起來很滿意，跟描述的一模一樣。',
    '第二次購買了，品質一如既往的好。',
    '整體還可以，但包裝稍嫌簡陋。',
    '雖然等了一下，但看到實品覺得很值得。',
    '顏色比照片漂亮，穿起來很舒服。',
    '音質很棒，降噪效果很好。',
    '非常實用的東西，生活方便多了。',
  ];

  protected validateAndTransform(): Promise<Review | null> {
    // 此 Loader 採用一對多生成邏輯，不使用基底類別的單筆轉換方法
    return Promise.resolve(null);
  }

  private async generateReviews(
    data: Record<string, unknown>,
  ): Promise<Review[] | null> {
    try {
      const scriptProductId = data.script_product_id;
      if (!scriptProductId) return null;

      const productId = this.idMapping.getMapping(
        'Product',
        Number(scriptProductId),
      );
      if (!productId) return null;

      // 取得一些已註冊的用戶
      const users = await this.entityManager.find(User, { take: 20 });
      if (users.length === 0) return null;

      const numReviews = Math.floor(Math.random() * 5) + 1;
      const reviews: Review[] = [];

      for (let i = 0; i < numReviews; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const review = new Review();
        review.productId = productId;
        review.userId = randomUser.userId;
        review.rating = Math.floor(Math.random() * 2) + 4; // 隨機 4-5 分
        review.comment =
          this.reviewComments[
            Math.floor(Math.random() * this.reviewComments.length)
          ];

        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        review.createdAt = date;
        review.updatedAt = date;

        reviews.push(review);
      }

      return reviews;
    } catch {
      return null;
    }
  }

  // 覆寫 load 因為一個 JSON entry 對應多個實體
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
    this.logger.log(`Starting to load ${this.entityName}... (force: ${force})`);

    const jsonData = this.loadJson();
    const allReviews: Review[] = [];
    const productIdsToUpdate = new Set<string>(); // 紀錄需要更新的產品 ID
    const errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }> = [];
    const skipped = 0;

    for (const data of jsonData) {
      const reviews = await this.generateReviews(data);
      if (reviews && reviews.length > 0) {
        allReviews.push(...reviews);
        // 紀錄此產品需要重新計算統計
        productIdsToUpdate.add(reviews[0].productId);
      }
    }

    let success = 0;
    if (allReviews.length > 0) {
      const saved = await this.entityManager.save(Review, allReviews);
      success = saved.length;

      // 同步更新產品統計資訊
      this.logger.log(
        `Updating statistics for ${productIdsToUpdate.size} products...`,
      );

      for (const productId of productIdsToUpdate) {
        const stats = (await this.entityManager
          .createQueryBuilder(Review, 'review')
          .select('COUNT(review.reviewId)', 'count')
          .addSelect('AVG(review.rating)', 'average')
          .where('review.productId = :productId', { productId })
          .getRawOne()) as { count: string; average: string };

        if (stats) {
          await this.entityManager.update(Product, productId, {
            totalReviews: parseInt(stats.count) || 0,
            averageRating: parseFloat(
              parseFloat(stats.average || '0').toFixed(1),
            ),
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Completed loading ${this.entityName}: ${success} inserted (${duration}ms)`,
    );

    return { success, skipped, errors };
  }

  protected async checkExists(): Promise<boolean> {
    // 評價是隨機生成的，通常在 force 模式下運行，這裡簡單回傳 false
    return Promise.resolve(false);
  }
}
