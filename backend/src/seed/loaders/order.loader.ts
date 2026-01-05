import { BaseLoader } from './base.loader';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { DataMapper } from '../utils/data-mapper';

export class OrderLoader extends BaseLoader<Order> {
  protected entityName = 'Order';
  protected jsonFileName = 'ecommerce_order_data.json';
  protected entityClass = Order;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Order | null> {
    try {
      if (
        !data.script_order_id ||
        !data.order_number ||
        !data.user_id ||
        !data.store_id
      ) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 user_id 和 store_id
      const userId = this.idMapping.getMapping(
        'User',
        typeof data.user_id === 'number' ? data.user_id : Number(data.user_id),
      );
      const storeId = this.idMapping.getMapping(
        'Store',
        typeof data.store_id === 'number'
          ? data.store_id
          : Number(data.store_id),
      );

      if (!userId || !storeId) {
        return Promise.resolve(null);
      }

      if (typeof data.order_number !== 'string') {
        return Promise.resolve(null);
      }

      // 解析 shipping_address_snapshot（從字串轉換為物件）
      let shippingAddressSnapshot: object;
      if (typeof data.shipping_address_snapshot === 'string') {
        const parsed: unknown = DataMapper.parseJson(
          data.shipping_address_snapshot,
        );
        if (!parsed || typeof parsed !== 'object' || parsed === null) {
          return Promise.resolve(null);
        }
        shippingAddressSnapshot = parsed;
      } else if (
        typeof data.shipping_address_snapshot === 'object' &&
        data.shipping_address_snapshot !== null
      ) {
        shippingAddressSnapshot = data.shipping_address_snapshot;
      } else {
        return Promise.resolve(null);
      }

      const order = new Order();
      order.orderNumber = data.order_number;
      order.userId = userId;
      order.storeId = storeId;
      order.orderStatus = data.order_status as OrderStatus;
      order.subtotal = Math.round(Number(data.subtotal));
      order.shippingFee = Math.round(Number(data.shipping_fee || 60));
      order.totalDiscount = Math.round(Number(data.total_discount || 0));
      order.totalAmount = Math.round(Number(data.total_amount));
      order.paymentMethod =
        typeof data.payment_method === 'string' ? data.payment_method : null;
      order.paymentReference =
        typeof data.payment_reference === 'string'
          ? data.payment_reference
          : null;
      order.idempotencyKey =
        typeof data.idempotency_key === 'string' ? data.idempotency_key : null;
      order.shippingAddressSnapshot = shippingAddressSnapshot;
      order.notes = typeof data.notes === 'string' ? data.notes : null;
      order.paidAt = DataMapper.parseDate(
        typeof data.paid_at === 'string' ? data.paid_at : null,
      );
      order.shippedAt = DataMapper.parseDate(
        typeof data.shipped_at === 'string' ? data.shipped_at : null,
      );
      order.deliveredAt = DataMapper.parseDate(
        typeof data.delivered_at === 'string' ? data.delivered_at : null,
      );
      order.completedAt = DataMapper.parseDate(
        typeof data.completed_at === 'string' ? data.completed_at : null,
      );
      order.cancelledAt = DataMapper.parseDate(
        typeof data.cancelled_at === 'string' ? data.cancelled_at : null,
      );

      return Promise.resolve(order);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Order): Promise<boolean> {
    const existing = await this.entityManager.findOne(Order, {
      where: { orderNumber: entity.orderNumber },
    });
    return existing !== null;
  }

  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }>;
  }> {
    const result = await super.load(force);

    // 更新 ID 映射
    if (result.success > 0) {
      const jsonData = this.loadJson();
      const orders = await this.entityManager.find(Order, {
        order: { orderId: 'DESC' },
        take: result.success,
      });

      for (const data of jsonData) {
        if (data.script_order_id) {
          const order = orders.find(
            (o) =>
              typeof data.order_number === 'string' &&
              o.orderNumber === data.order_number,
          );
          if (order) {
            this.idMapping.setMapping(
              'Order',
              typeof data.script_order_id === 'number'
                ? data.script_order_id
                : Number(data.script_order_id),
              order.orderId,
            );
          }
        }
      }
    }

    return result;
  }
}
