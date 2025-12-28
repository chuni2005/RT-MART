import { BaseLoader } from './base.loader';
import { CartItem } from '../../carts/entities/cart-item.entity';

export class CartItemLoader extends BaseLoader<CartItem> {
  protected entityName = 'CartItem';
  protected jsonFileName = 'ecommerce_cart_item_data.json';
  protected entityClass = CartItem;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<CartItem | null> {
    try {
      if (
        !data.cart_id ||
        !data.product_id ||
        data.quantity === undefined ||
        data.quantity === null
      ) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 cart_id 和 product_id
      const cartId = this.idMapping.getMapping(
        'Cart',
        typeof data.cart_id === 'number' ? data.cart_id : Number(data.cart_id),
      );
      const productId = this.idMapping.getMapping(
        'Product',
        typeof data.product_id === 'number'
          ? data.product_id
          : Number(data.product_id),
      );

      if (!cartId || !productId) {
        return Promise.resolve(null);
      }

      const cartItem = new CartItem();
      cartItem.cartId = cartId;
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
        cartId: entity.cartId,
        productId: entity.productId,
      },
    });
    return existing !== null;
  }
}
