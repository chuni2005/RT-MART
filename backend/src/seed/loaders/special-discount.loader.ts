import { BaseLoader } from './base.loader';
import { SpecialDiscount } from '../../discounts/entities/special-discount.entity';

export class SpecialDiscountLoader extends BaseLoader<SpecialDiscount> {
  protected entityName = 'SpecialDiscount';
  protected jsonFileName = 'ecommerce_special_discount_data.json';
  protected entityClass = SpecialDiscount;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<SpecialDiscount | null> {
    try {
      if (!data.discount_id || !data.store_id) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 discount_id 和 store_id
      const discountId = this.idMapping.getMapping(
        'Discount',
        typeof data.discount_id === 'number'
          ? data.discount_id
          : Number(data.discount_id),
      );
      const storeId = this.idMapping.getMapping(
        'Store',
        typeof data.store_id === 'number'
          ? data.store_id
          : Number(data.store_id),
      );

      if (!discountId || !storeId) {
        return Promise.resolve(null);
      }

      const specialDiscount = new SpecialDiscount();
      specialDiscount.discountId = discountId;
      specialDiscount.storeId = storeId;
      specialDiscount.productTypeId = data.product_type_id
        ? this.idMapping.getMapping(
            'ProductType',
            typeof data.product_type_id === 'number'
              ? data.product_type_id
              : Number(data.product_type_id),
          )
        : null;
      specialDiscount.discountRate = data.discount_rate
        ? Number(data.discount_rate)
        : null;
      specialDiscount.maxDiscountAmount = data.max_discount_amount
        ? Math.round(Number(data.max_discount_amount))
        : null;

      return Promise.resolve(specialDiscount);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: SpecialDiscount): Promise<boolean> {
    const existing = await this.entityManager.findOne(SpecialDiscount, {
      where: { discountId: entity.discountId },
    });
    return existing !== null;
  }
}
