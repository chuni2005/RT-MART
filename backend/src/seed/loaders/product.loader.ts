import { IsNull } from 'typeorm';
import { BaseLoader } from './base.loader';
import { Product } from '../../products/entities/product.entity';
import { DataMapper } from '../utils/data-mapper';

export class ProductLoader extends BaseLoader<Product> {
  protected entityName = 'Product';
  protected jsonFileName = 'ecommerce_product_data.json';
  protected entityClass = Product;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Product | null> {
    try {
      if (!data.script_product_id || !data.store_id || !data.product_type_id) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 store_id 和 product_type_id
      const storeId = this.idMapping.getMapping(
        'Store',
        typeof data.store_id === 'number'
          ? data.store_id
          : Number(data.store_id),
      );
      const productTypeId = this.idMapping.getMapping(
        'ProductType',
        typeof data.product_type_id === 'number'
          ? data.product_type_id
          : Number(data.product_type_id),
      );

      if (!storeId || !productTypeId) {
        return Promise.resolve(null);
      }

      if (typeof data.product_name !== 'string' || !data.price) {
        return Promise.resolve(null);
      }

      const product = new Product();
      product.storeId = storeId;
      product.productTypeId = productTypeId;
      product.productName = data.product_name;
      product.description =
        typeof data.description === 'string' ? data.description : null;
      product.price = Number(data.price);
      product.soldCount =
        typeof data.sold_count === 'number'
          ? data.sold_count
          : Number(data.sold_count) || 0;
      product.averageRating =
        typeof data.average_rating === 'number'
          ? data.average_rating
          : Number(data.average_rating) || 0;
      product.totalReviews =
        typeof data.total_reviews === 'number'
          ? data.total_reviews
          : Number(data.total_reviews) || 0;
      product.isActive =
        typeof data.is_active === 'boolean' ? data.is_active : true;
      product.deletedAt = DataMapper.parseDate(
        typeof data.deleted_at === 'string' ? data.deleted_at : null,
      );

      return Promise.resolve(product);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Product): Promise<boolean> {
    const existing = await this.entityManager.findOne(Product, {
      where: {
        productName: entity.productName,
        storeId: entity.storeId,
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
      const products = await this.entityManager.find(Product, {
        order: { productId: 'DESC' },
        take: result.success,
      });

      for (const data of jsonData) {
        if (data.script_product_id) {
          const storeId = this.idMapping.getMapping(
            'Store',
            typeof data.store_id === 'number'
              ? data.store_id
              : Number(data.store_id),
          );
          if (storeId && typeof data.product_name === 'string') {
            const product = products.find(
              (p) =>
                p.storeId === storeId && p.productName === data.product_name,
            );
            if (product) {
              this.idMapping.setMapping(
                'Product',
                typeof data.script_product_id === 'number'
                  ? data.script_product_id
                  : Number(data.script_product_id),
                product.productId,
              );
            }
          }
        }
      }
    }

    return result;
  }
}
