import { BaseLoader } from './base.loader';
import { OrderDiscount } from '../../orders/entities/order-discount.entity';
import { DiscountType } from '../../discounts/entities/discount.entity';

export class OrderDiscountLoader extends BaseLoader<OrderDiscount> {
  protected entityName = 'OrderDiscount';
  protected jsonFileName = 'ecommerce_order_discount_data.json';
  protected entityClass = OrderDiscount;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<OrderDiscount | null> {
    try {
      if (!data.order_id || !data.discount_id || !data.discount_type) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 order_id 和 discount_id
      const orderId = this.idMapping.getMapping(
        'Order',
        typeof data.order_id === 'number'
          ? data.order_id
          : Number(data.order_id),
      );
      const discountId = this.idMapping.getMapping(
        'Discount',
        typeof data.discount_id === 'number'
          ? data.discount_id
          : Number(data.discount_id),
      );

      if (!orderId || !discountId) {
        return Promise.resolve(null);
      }

      if (data.discount_amount === undefined || data.discount_amount === null) {
        return Promise.resolve(null);
      }

      const orderDiscount = new OrderDiscount();
      orderDiscount.orderId = orderId;
      orderDiscount.discountId = discountId;
      orderDiscount.discountType = data.discount_type as DiscountType;
      orderDiscount.discountAmount = Math.round(Number(data.discount_amount));

      return Promise.resolve(orderDiscount);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: OrderDiscount): Promise<boolean> {
    const existing = await this.entityManager.findOne(OrderDiscount, {
      where: {
        orderId: entity.orderId,
        discountType: entity.discountType,
      },
    });
    return existing !== null;
  }
}
