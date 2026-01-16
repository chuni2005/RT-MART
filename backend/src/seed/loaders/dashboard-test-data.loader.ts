import { EntityManager, Not } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { Seller } from '../../sellers/entities/seller.entity';
import { IdMapping } from '../utils/id-mapping';

/**
 * 專門為 Dashboard 測試產生的假資料載入器
 * 針對特定賣家和商店產生過去一年的交易數據
 */
export class DashboardTestDataLoader {
  constructor(
    private entityManager: EntityManager,
    private idMapping: IdMapping,
    private logger: Logger,
  ) {}

  async load(): Promise<{ success: number; errors: string[] }> {
    this.logger.log('開始為賣家 14 產生 Dashboard 測試數據...');

    // 1. 取得實際的 sellerId 和 storeId (從 IdMapping 取得 script_id 14 對應的實際 ID)
    const sellerRealId = this.idMapping.getMapping('Seller', 14);
    const storeRealId = this.idMapping.getMapping('Store', 14);

    if (!sellerRealId || !storeRealId) {
      this.logger.error(
        '找不到賣家 14 或商店 14 的映射。請確保 SellerLoader 和 StoreLoader 已執行。',
      );
      return { success: 0, errors: ['Seller or Store mapping missing'] };
    }

    // 2. 取得商店擁有的產品
    const products = await this.entityManager.find(Product, {
      where: { storeId: storeRealId },
    });

    if (products.length === 0) {
      this.logger.error('商店 14 沒有產品，無法產生訂單。');
      return { success: 0, errors: ['No products found for store 14'] };
    }

    // 3. 取得賣家的 userId 以便排除（避免自己買自己的東西）
    const seller = await this.entityManager.findOne(Seller, {
      where: { sellerId: sellerRealId },
    });
    const sellerUserId = seller?.userId;

    // 4. 取得其他用戶作為買家
    const buyers = await this.entityManager.find(User, {
      where: { userId: Not(sellerUserId || '0') },
      take: 50, // 取前 50 個用戶作為隨機買家
    });

    if (buyers.length === 0) {
      this.logger.error('找不到買家用戶。');
      return { success: 0, errors: ['No buyers found'] };
    }

    const orders: Order[] = [];
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // 5. 產生 700 筆訂單，時間分佈在過去一年
    const orderCount = 700;
    this.logger.log(`準備產生 ${orderCount} 筆訂單...`);

    for (let i = 0; i < orderCount; i++) {
      // 隨機產生過去一年內的時間
      const randomTime =
        oneYearAgo.getTime() +
        Math.random() * (now.getTime() - oneYearAgo.getTime());
      const orderDate = new Date(randomTime);

      const buyer = buyers[Math.floor(Math.random() * buyers.length)];

      const order = new Order();

      // 參考 OrdersService 的訂單編號格式: ORD{timestamp}{4位隨機數}
      const timestamp = orderDate.getTime();
      const randomStr = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      order.orderNumber = `ORD${timestamp}${randomStr}`;

      order.userId = buyer.userId;
      order.storeId = storeRealId;

      // 狀態分佈邏輯：
      // 一個月之前的訂單狀態不是 complete(95%) 就是 cancel(5%)
      let selectedStatus: OrderStatus;
      if (orderDate < oneMonthAgo) {
        selectedStatus =
          Math.random() < 0.95 ? OrderStatus.COMPLETED : OrderStatus.CANCELLED;
      } else {
        // 最近一個月的狀態分佈可以多樣化，以利測試 Dashboard 的即時數據
        const statusWeights = [
          { status: OrderStatus.COMPLETED, weight: 50 },
          { status: OrderStatus.DELIVERED, weight: 15 },
          { status: OrderStatus.SHIPPED, weight: 10 },
          { status: OrderStatus.PAID, weight: 10 },
          { status: OrderStatus.PROCESSING, weight: 5 },
          { status: OrderStatus.CANCELLED, weight: 5 },
          { status: OrderStatus.PENDING_PAYMENT, weight: 5 },
        ];

        let randomWeight = Math.random() * 100;
        selectedStatus = OrderStatus.COMPLETED;
        for (const sw of statusWeights) {
          if (randomWeight < sw.weight) {
            selectedStatus = sw.status;
            break;
          }
          randomWeight -= sw.weight;
        }
      }

      order.orderStatus = selectedStatus;
      order.createdAt = orderDate;
      order.updatedAt = orderDate;

      // 只有非 CANCELLED 的訂單有支付時間
      if (
        order.orderStatus !== OrderStatus.CANCELLED &&
        order.orderStatus !== OrderStatus.PENDING_PAYMENT
      ) {
        order.paidAt = new Date(orderDate.getTime() + Math.random() * 3600000); // 1小時內支付
      }

      if (
        order.orderStatus === OrderStatus.COMPLETED ||
        order.orderStatus === OrderStatus.DELIVERED
      ) {
        order.completedAt = new Date(
          orderDate.getTime() + Math.random() * 86400000 * 3,
        ); // 3天內完成
      }

      // 隨機選 1-4 個商品
      const itemsInOrderCount = Math.floor(Math.random() * 4) + 1;
      const orderItems: OrderItem[] = [];
      let subtotal = 0;

      for (let j = 0; j < itemsInOrderCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;

        const item = new OrderItem();
        item.productId = product.productId;
        item.productSnapshot = {
          product_id: product.productId,
          product_name: product.productName,
          price: product.price,
        };
        item.quantity = quantity;
        item.originalPrice = Number(product.price);
        item.unitPrice = Number(product.price);
        item.itemDiscount = 0;
        item.subtotal = item.unitPrice * quantity;

        subtotal += item.subtotal;
        orderItems.push(item);
      }

      order.items = orderItems;
      order.subtotal = subtotal;
      order.shippingFee = 60;
      order.totalDiscount = 0;
      order.totalAmount = subtotal + order.shippingFee;

      // 參考 OrdersService 的付款方式: 'credit_card' 或 'cash_on_delivery'
      order.paymentMethod =
        Math.random() < 0.95 ? 'credit_card' : 'cash_on_delivery';

      order.shippingAddressSnapshot = {
        receiverName: buyer.name,
        phoneNumber: buyer.phoneNumber || '0912345678',
        address: '測試地址',
      };

      orders.push(order);
    }

    try {
      // 為了效能，分批儲存
      const batchSize = 100;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        await this.entityManager.save(Order, batch);
      }

      // 更新產品的銷售數量 (soldCount)
      this.logger.log('正在更新產品銷售數量...');
      const productSalesMap = new Map<string, number>();
      for (const order of orders) {
        if (order.orderStatus !== OrderStatus.CANCELLED) {
          for (const item of order.items) {
            if (item.productId) {
              const current = productSalesMap.get(item.productId) || 0;
              productSalesMap.set(item.productId, current + item.quantity);
            }
          }
        }
      }

      for (const [productId, soldQuantity] of productSalesMap.entries()) {
        await this.entityManager.increment(
          Product,
          { productId },
          'soldCount',
          soldQuantity,
        );
      }

      this.logger.log(`成功產生 ${orders.length} 筆測試訂單。`);
      return { success: orders.length, errors: [] };
    } catch (error) {
      this.logger.error(
        '儲存測試訂單失敗',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
