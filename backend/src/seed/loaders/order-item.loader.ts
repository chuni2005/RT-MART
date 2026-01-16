import { BaseLoader } from './base.loader';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { DataMapper } from '../utils/data-mapper';

export class OrderItemLoader extends BaseLoader<OrderItem> {
  protected entityName = 'OrderItem';
  protected jsonFileName = 'ecommerce_order_item_data.json';
  protected entityClass = OrderItem;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<OrderItem | null> {
    try {
      if (!data.order_id || !data.quantity) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 order_id 和 product_id
      const orderId = this.idMapping.getMapping(
        'Order',
        typeof data.order_id === 'number'
          ? data.order_id
          : Number(data.order_id),
      );
      if (!orderId) {
        return Promise.resolve(null);
      }

      const productId = data.product_id
        ? this.idMapping.getMapping(
            'Product',
            typeof data.product_id === 'number'
              ? data.product_id
              : Number(data.product_id),
          )
        : null;

      // 解析 product_snapshot（應該是 JSON 物件）
      let productSnapshot: object;
      if (typeof data.product_snapshot === 'string') {
        const parsed: unknown = DataMapper.parseJson(data.product_snapshot);
        if (!parsed || typeof parsed !== 'object' || parsed === null) {
          return Promise.resolve(null);
        }
        productSnapshot = parsed;
      } else if (
        typeof data.product_snapshot === 'object' &&
        data.product_snapshot !== null
      ) {
        productSnapshot = data.product_snapshot;
      } else {
        return Promise.resolve(null);
      }

      const orderItem = new OrderItem();
      orderItem.orderId = orderId;
      orderItem.productId = productId;
      orderItem.productSnapshot = productSnapshot;
      orderItem.quantity =
        typeof data.quantity === 'number'
          ? data.quantity
          : Number(data.quantity);
      orderItem.originalPrice = Math.round(Number(data.original_price));
      orderItem.itemDiscount = Math.round(Number(data.item_discount || 0));
      orderItem.unitPrice = Math.round(Number(data.unit_price));
      orderItem.subtotal = Math.round(Number(data.subtotal));

      return Promise.resolve(orderItem);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: OrderItem): Promise<boolean> {
    const where: { orderId: string; productId?: string } = {
      orderId: entity.orderId,
    };
    if (entity.productId) {
      where.productId = entity.productId;
    }
    const existing = await this.entityManager.findOne(OrderItem, { where });
    return existing !== null;
  }
}
