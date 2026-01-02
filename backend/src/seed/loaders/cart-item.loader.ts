import { BaseLoader } from './base.loader';
import { CartItem } from '../../carts-item/entities/cart-item.entity';

export class CartItemLoader extends BaseLoader<CartItem> {
  protected entityName = 'CartItem';
  protected jsonFileName = 'ecommerce_cart_item_data.json';
  protected entityClass = CartItem;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<CartItem | null> {
    try {
      if (
        !data.user_id ||
        !data.product_id ||
        data.quantity === undefined ||
        data.quantity === null
      ) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 user_id 和 product_id
      const userId = this.idMapping.getMapping(
        'User',
        typeof data.user_id === 'number' ? data.user_id : Number(data.user_id),
      );
      const productId = this.idMapping.getMapping(
        'Product',
        typeof data.product_id === 'number'
          ? data.product_id
          : Number(data.product_id),
      );

      if (!userId || !productId) {
        return Promise.resolve(null);
      }

      const cartItem = new CartItem();
      cartItem.userId = userId;
      cartItem.productId = productId;
      cartItem.quantity =
        typeof data.quantity === 'number'
          ? data.quantity
          : Number(data.quantity);
      cartItem.selected =
        data.selected !== undefined ? Boolean(data.selected) : true;

      return Promise.resolve(cartItem);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: CartItem): Promise<boolean> {
    const existing = await this.entityManager.findOne(CartItem, {
      where: {
        userId: entity.userId,
        productId: entity.productId,
      },
    });
    return existing !== null;
  }
}
