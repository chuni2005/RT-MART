import { BaseLoader } from './base.loader';
import { ShippingDiscount } from '../../discounts/entities/shipping-discount.entity';

export class ShippingDiscountLoader extends BaseLoader<ShippingDiscount> {
  protected entityName = 'ShippingDiscount';
  protected jsonFileName = 'ecommerce_shipping_discount_data.json';
  protected entityClass = ShippingDiscount;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<ShippingDiscount | null> {
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

      if (data.discount_amount === undefined || data.discount_amount === null) {
        return Promise.resolve(null);
      }

      const shippingDiscount = new ShippingDiscount();
      shippingDiscount.discountId = discountId;
      shippingDiscount.discountAmount = Math.round(
        Number(data.discount_amount),
      );

      return Promise.resolve(shippingDiscount);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: ShippingDiscount): Promise<boolean> {
    const existing = await this.entityManager.findOne(ShippingDiscount, {
      where: { discountId: entity.discountId },
    });
    return existing !== null;
  }
}
