/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { IsNull } from 'typeorm';
import { BaseLoader } from './base.loader';
import { Store } from '../../stores/entities/store.entity';

export class StoreLoader extends BaseLoader<Store> {
  protected entityName = 'Store';
  protected jsonFileName = 'ecommerce_store_data.json';
  protected entityClass = Store;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Store | null> {
    try {
      if (!data.script_store_id || !data.seller_id) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 seller_id
      const sellerId = this.idMapping.getMapping(
        'Seller',
        typeof data.seller_id === 'number'
          ? data.seller_id
          : Number(data.seller_id),
      );
      if (!sellerId) {
        return Promise.resolve(null);
      }

      if (typeof data.store_name !== 'string') {
        return Promise.resolve(null);
      }

      const store = new Store();
      store.sellerId = sellerId;
      store.storeName = data.store_name;
      store.storeDescription =
        typeof data.store_description === 'string'
          ? data.store_description
          : null;
      store.storeAddress =
        typeof data.store_address === 'string' ? data.store_address : null;
      store.storeEmail =
        typeof data.store_email === 'string' ? data.store_email : null;
      store.storePhone =
        typeof data.store_phone === 'string' ? data.store_phone : null;

      // Generate avatar URL based on script_store_id (which is used as temporary ID in seed data)
      const tempId = data.script_store_id || Math.floor(Math.random() * 100);
      store.avatar = `https://i.pravatar.cc/150?img=${tempId}`;

      store.averageRating =
        typeof data.average_rating === 'number'
          ? data.average_rating
          : Number(data.average_rating) || 0;
      store.totalRatings =
        typeof data.total_ratings === 'number'
          ? data.total_ratings
          : Number(data.total_ratings) || 0;
      store.productCount = 0;
      store.deletedAt = null;

      return Promise.resolve(store);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Store): Promise<boolean> {
    const existing = await this.entityManager.findOne(Store, {
      where: {
        storeName: entity.storeName,
        sellerId: entity.sellerId,
        deletedAt: IsNull(),
      },
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
      const stores = await this.entityManager.find(Store, {
        order: { storeId: 'DESC' },
        take: result.success,
      });

      for (const data of jsonData) {
        if (data.script_store_id) {
          const sellerId = this.idMapping.getMapping(
            'Seller',
            typeof data.seller_id === 'number'
              ? data.seller_id
              : Number(data.seller_id),
          );
          if (sellerId && typeof data.store_name === 'string') {
            const store = stores.find(
              (s) => s.sellerId === sellerId && s.storeName === data.store_name,
            );
            if (store) {
              this.idMapping.setMapping(
                'Store',
                typeof data.script_store_id === 'number'
                  ? data.script_store_id
                  : Number(data.script_store_id),
                store.storeId,
              );
            }
          }
        }
      }
    }

    return result;
  }
}
