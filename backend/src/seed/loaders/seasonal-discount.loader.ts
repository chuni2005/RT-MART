import { BaseLoader } from './base.loader';
import { SeasonalDiscount } from '../../discounts/entities/seasonal-discount.entity';

export class SeasonalDiscountLoader extends BaseLoader<SeasonalDiscount> {
  protected entityName = 'SeasonalDiscount';
  protected jsonFileName = 'ecommerce_seasonal_discount_data.json';
  protected entityClass = SeasonalDiscount;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<SeasonalDiscount | null> {
    try {
      if (!data.discount_id) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 discount_id
      const discountId = this.idMapping.getMapping(
        'Discount',
        typeof data.discount_id === 'number'
          ? data.discount_id
          : Number(data.discount_id),
      );
      if (!discountId) {
        return Promise.resolve(null);
      }

      if (data.discount_rate === undefined || data.discount_rate === null) {
        return Promise.resolve(null);
      }

      const seasonalDiscount = new SeasonalDiscount();
      seasonalDiscount.discountId = discountId;
      seasonalDiscount.discountRate = Number(data.discount_rate);
      seasonalDiscount.maxDiscountAmount = data.max_discount_amount
        ? Math.round(Number(data.max_discount_amount))
        : null;

      return Promise.resolve(seasonalDiscount);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: SeasonalDiscount): Promise<boolean> {
    const existing = await this.entityManager.findOne(SeasonalDiscount, {
      where: { discountId: entity.discountId },
    });
    return existing !== null;
  }
}
