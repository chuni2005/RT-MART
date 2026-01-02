import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BatchUpdateCartItemsDto } from './dto/batch-update-cart-items.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CartHistoryService } from '../cart-history/cart-history.service';
import { CartHistory } from '../cart-history/entities/cart-history.entity';

@Injectable()
export class CartItemsService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly inventoryService: InventoryService,
    private readonly cartHistoryService: CartHistoryService,
  ) {}
  /**
   * Return all cart items for a user with product relations
   */
  async getCart(userId: string): Promise<CartItem[]> {
    return await this.cartItemRepository.find({
      where: { userId },
      relations: [
        'product',
        'product.images',
        'product.store',
        'product.inventory',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartItem[]> {
    // Check if product is already in cart for this user
    const existingItem = await this.cartItemRepository.findOne({
      where: { userId, productId: addToCartDto.productId },
    });

    // Check stock availability
    const stock = await this.inventoryService.getAvailableStock(
      addToCartDto.productId,
    );

    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const requestedTotal = currentQuantityInCart + addToCartDto.quantity;

    if (stock < requestedTotal) {
      throw new BadRequestException(
        `庫存不足。您的購物車已有 ${currentQuantityInCart} 件商品，目前可用庫存為 ${stock}件。`,
      );
    }

    if (existingItem) {
      // Update quantity and selected status
      existingItem.quantity += addToCartDto.quantity;
      if (addToCartDto.selected !== undefined) {
        existingItem.selected = addToCartDto.selected;
      }
      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepository.create({
        userId,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        selected: addToCartDto.selected ?? true,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return await this.getCart(userId);
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<CartItem[]> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('CartItem item not found');
    }

    // Check stock availability
    const stock = await this.inventoryService.getAvailableStock(
      cartItem.productId,
    );

    if (updateDto.quantity !== undefined && stock < updateDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available stock is ${stock}.`,
      );
    }

    if (updateDto.quantity !== undefined) {
      cartItem.quantity = updateDto.quantity;
    }
    if (updateDto.selected !== undefined) {
      cartItem.selected = updateDto.selected;
    }
    await this.cartItemRepository.save(cartItem);

    return await this.getCart(userId);
  }

  async batchUpdateCartItems(
    userId: string,
    batchDto: BatchUpdateCartItemsDto,
  ): Promise<CartItem[]> {
    for (const itemUpdate of batchDto.items) {
      const cartItem = await this.cartItemRepository.findOne({
        where: { cartItemId: itemUpdate.cartItemId, userId },
      });

      if (cartItem) {
        cartItem.selected = itemUpdate.selected;
        await this.cartItemRepository.save(cartItem);
      }
    }

    return await this.getCart(userId);
  }

  async removeFromCart(
    userId: string,
    cartItemId: string,
  ): Promise<CartItem[]> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('CartItem item not found');
    }

    await this.cartItemRepository.remove(cartItem);

    return await this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }

  async removeSelectedItems(userId: string): Promise<void> {
    await this.cartItemRepository.delete({
      userId,
      selected: true,
    });
  }

  async getCartSummary(userId: string): Promise<{
    cart: CartItem[];
    totalItems: number;
    totalAmount: number;
    selectedTotalAmount: number;
  }> {
    const items = await this.getCart(userId);

    let totalItems = 0;
    let totalAmount = 0;
    let selectedTotalAmount = 0;

    for (const item of items) {
      const price = Number(item.product?.price || 0);
      const itemSubtotal = price * item.quantity;
      totalItems += item.quantity;
      totalAmount += itemSubtotal;

      if (item.selected) selectedTotalAmount += itemSubtotal;
    }

    return {
      cart: items,
      totalItems,
      totalAmount,
      selectedTotalAmount,
    };
  }

  /**
   * Move selected cart items to cart history snapshot and remove them from cart
   */
  async moveSelectedToHistory(userId: string): Promise<CartHistory> {
    const { cart: items, selectedTotalAmount } =
      await this.getCartSummary(userId);

    const selectedItems = (items || []).filter((i) => i.selected);

    if (selectedItems.length === 0) {
      throw new BadRequestException('No selected items to move to history');
    }

    const cartSnapshot = {
      items: selectedItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        product: i.product,
      })),
      totalAmount: selectedTotalAmount,
    };

    const history = await this.cartHistoryService.saveCartSnapshot(
      userId,
      cartSnapshot,
      selectedItems.length,
    );

    // remove selected items from cart
    await this.removeSelectedItems(userId);

    return history;
  }
}
