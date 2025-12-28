import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { IdMapping } from './utils/id-mapping';
import { UserLoader } from './loaders/user.loader';
import { SellerLoader } from './loaders/seller.loader';
import { ShippingAddressLoader } from './loaders/shipping-address.loader';
import { StoreLoader } from './loaders/store.loader';
import { ProductTypeLoader } from './loaders/product-type.loader';
import { ProductLoader } from './loaders/product.loader';
import { InventoryLoader } from './loaders/inventory.loader';
import { ProductImageLoader } from './loaders/product-image.loader';
import { CartLoader } from './loaders/cart.loader';
import { CartItemLoader } from './loaders/cart-item.loader';
import { DiscountLoader } from './loaders/discount.loader';
import { SeasonalDiscountLoader } from './loaders/seasonal-discount.loader';
import { ShippingDiscountLoader } from './loaders/shipping-discount.loader';
import { SpecialDiscountLoader } from './loaders/special-discount.loader';
import { OrderLoader } from './loaders/order.loader';
import { OrderItemLoader } from './loaders/order-item.loader';
import { OrderDiscountLoader } from './loaders/order-discount.loader';
import { CartHistoryLoader } from './loaders/cart-history.loader';
import { UserTokenLoader } from './loaders/user-token.loader';
import { AuditLogLoader } from './loaders/audit-log.loader';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  /**
   * 執行 seed 操作
   * @param entityManager EntityManager 實例
   * @param idMapping IdMapping 實例
   * @param force 是否強制重新 seed（清空現有資料）
   */
  async run(
    entityManager: EntityManager,
    idMapping: IdMapping,
    force: boolean = false,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Starting seed process (force: ${force})...`);

    if (force) {
      await this.clearAll(entityManager);
      idMapping.clear();
    }

    // 定義載入順序（考慮外鍵依賴）
    const loaders = [
      new UserLoader(entityManager, idMapping, this.logger),
      new SellerLoader(entityManager, idMapping, this.logger),
      new ShippingAddressLoader(entityManager, idMapping, this.logger),
      new StoreLoader(entityManager, idMapping, this.logger),
      new ProductTypeLoader(entityManager, idMapping, this.logger),
      new ProductLoader(entityManager, idMapping, this.logger),
      new InventoryLoader(entityManager, idMapping, this.logger),
      new ProductImageLoader(entityManager, idMapping, this.logger),
      new CartLoader(entityManager, idMapping, this.logger),
      new CartItemLoader(entityManager, idMapping, this.logger),
      new DiscountLoader(entityManager, idMapping, this.logger),
      new SeasonalDiscountLoader(entityManager, idMapping, this.logger),
      new ShippingDiscountLoader(entityManager, idMapping, this.logger),
      new SpecialDiscountLoader(entityManager, idMapping, this.logger),
      new OrderLoader(entityManager, idMapping, this.logger),
      new OrderItemLoader(entityManager, idMapping, this.logger),
      new OrderDiscountLoader(entityManager, idMapping, this.logger),
      new CartHistoryLoader(entityManager, idMapping, this.logger),
    ];

    const results: Array<{
      loader: string;
      success: number;
      skipped: number;
      errors: any[];
    }> = [];
    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // 依序執行所有 loader
    for (const loader of loaders) {
      try {
        const result = await loader.load(force);
        results.push({
          loader: loader.constructor.name,
          ...result,
        });
        totalSuccess += result.success;
        totalSkipped += result.skipped;
        totalErrors += result.errors.length;
      } catch (error) {
        this.logger.error(
          `Failed to load ${loader.constructor.name}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }

    this.logger.log('Generating UserToken and AuditLog from seed data...');

    const userTokenLoader = new UserTokenLoader(entityManager, this.logger);
    const auditLogLoader = new AuditLogLoader(entityManager, this.logger);

    // Synchronize product counts for all stores
    this.logger.log('Synchronizing product counts for all stores...');
    try {
      const stores = await entityManager.find(Store);
      for (const store of stores) {
        const count = await entityManager.getRepository(Product).count({
          where: { storeId: store.storeId },
        });
        await entityManager.update(Store, store.storeId, {
          productCount: count,
        });
      }
      this.logger.log('Product counts synchronized.');
    } catch (error) {
      this.logger.error(
        'Failed to synchronize product counts',
        error instanceof Error ? error.stack : String(error),
      );
    }

    try {
      const userTokenResult = await userTokenLoader.load(force);
      results.push({
        loader: 'UserTokenLoader',
        ...userTokenResult,
      });
      totalSuccess += userTokenResult.success;
      totalSkipped += userTokenResult.skipped;
      totalErrors += userTokenResult.errors.length;
    } catch (error) {
      this.logger.error(
        'Failed to load UserToken',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    try {
      const auditLogResult = await auditLogLoader.load(force);
      results.push({
        loader: 'AuditLogLoader',
        ...auditLogResult,
      });
      totalSuccess += auditLogResult.success;
      totalSkipped += auditLogResult.skipped;
      totalErrors += auditLogResult.errors.length;
    } catch (error) {
      this.logger.error(
        'Failed to load AuditLog',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Seed process completed: ${totalSuccess} inserted, ${totalSkipped} skipped, ${totalErrors} errors (${duration}ms)`,
    );

    // 輸出詳細報告
    this.logger.log('=== Seed Summary ===');
    for (const result of results) {
      this.logger.log(
        `${result.loader}: ${result.success} inserted, ${result.skipped} skipped, ${result.errors.length} errors`,
      );
      if (result.errors.length > 0) {
        this.logger.warn(
          `Errors in ${result.loader}: ${JSON.stringify(result.errors.slice(0, 5))}`,
        );
      }
    }
  }

  /**
   * 清空所有資料（按插入順序的倒序）
   */
  private async clearAll(entityManager: EntityManager): Promise<void> {
    this.logger.log('Clearing all data...');

    // 清空順序（與插入順序相反）
    const clearOrder = [
      'AuditLog', // 先清空 AuditLog
      'UserToken', // 再清空 UserToken
      'CartHistory',
      'OrderDiscount',
      'OrderItem',
      'Order',
      'SpecialDiscount',
      'ShippingDiscount',
      'SeasonalDiscount',
      'Discount',
      'CartItem',
      'Cart',
      'ProductImage',
      'Inventory',
      'Product',
      'ProductType',
      'Store',
      'ShippingAddress',
      'Seller',
      'User',
    ];

    for (const tableName of clearOrder) {
      try {
        await entityManager.query(`DELETE FROM \`${tableName}\``);
        this.logger.log(`Cleared ${tableName}`);
      } catch (error) {
        this.logger.error(
          `Failed to clear ${tableName}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }

    this.logger.log('All data cleared');
  }
}
