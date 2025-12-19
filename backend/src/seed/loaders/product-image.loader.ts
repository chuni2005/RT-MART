import { BaseLoader } from './base.loader';
import { ProductImage } from '../../products/entities/product-image.entity';

export class ProductImageLoader extends BaseLoader<ProductImage> {
  protected entityName = 'ProductImage';
  protected jsonFileName = 'ecommerce_product_image_data.json';
  protected entityClass = ProductImage;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<ProductImage | null> {
    try {
      if (!data.product_id || !data.image_url) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 product_id
      const productId = this.idMapping.getMapping(
        'Product',
        typeof data.product_id === 'number'
          ? data.product_id
          : Number(data.product_id),
      );
      if (!productId) {
        return Promise.resolve(null);
      }

      if (typeof data.image_url !== 'string') {
        return Promise.resolve(null);
      }

      const image = new ProductImage();
      image.productId = productId;
      image.imageUrl = data.image_url;
      image.publicId = typeof data.public_id === 'string' ? data.public_id : '';
      image.displayOrder =
        typeof data.display_order === 'number'
          ? data.display_order
          : Number(data.display_order) || 1;

      return Promise.resolve(image);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: ProductImage): Promise<boolean> {
    const existing = await this.entityManager.findOne(ProductImage, {
      where: {
        productId: entity.productId,
        imageUrl: entity.imageUrl,
      },
    });
    return existing !== null;
  }
}
