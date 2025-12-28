import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BatchUpdateCartItemsDto } from './dto/batch-update-cart-items.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly inventoryService: InventoryService,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'items.product.store',
        'items.product.inventory',
      ],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    // Check if product is already in cart
    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.cartId, productId: addToCartDto.productId },
    });

    // Check stock availability
    const stock = await this.inventoryService.getAvailableStock(
      addToCartDto.productId,
    );
    if (stock < addToCartDto.quantity) {
      throw new BadRequestException('Product quantity is not enough');
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
        cartId: cart.cartId,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        selected: addToCartDto.selected ?? true, // Default to true if not provided
      });
      await this.cartItemRepository.save(cartItem);
    }

    return await this.getOrCreateCart(userId);
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { cartItemId, cartId: cart.cartId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability only if quantity is being updated
    if (updateDto.quantity !== undefined) {
      const isAvailable = await this.inventoryService.checkStockAvailability(
        cartItem.productId,
        updateDto.quantity,
      );

      if (!isAvailable) {
        throw new BadRequestException('Insufficient stock for this product');
      }
      cartItem.quantity = updateDto.quantity;
    }

    // Update selected status if provided
    if (updateDto.selected !== undefined) {
      cartItem.selected = updateDto.selected;
    }

    await this.cartItemRepository.save(cartItem);

    return await this.getOrCreateCart(userId);
  }

  async batchUpdateCartItems(
    userId: string,
    batchDto: BatchUpdateCartItemsDto,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    for (const itemUpdate of batchDto.items) {
      const cartItem = await this.cartItemRepository.findOne({
        where: { cartItemId: itemUpdate.cartItemId, cartId: cart.cartId },
      });

      if (cartItem) {
        cartItem.selected = itemUpdate.selected;
        await this.cartItemRepository.save(cartItem);
      }
    }

    return await this.getOrCreateCart(userId);
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { cartItemId, cartId: cart.cartId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);

    return await this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.cartId });
  }

  async removeSelectedItems(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({
      cartId: cart.cartId,
      selected: true,
    });
  }

  async getCartSummary(userId: string): Promise<{
    cart: Cart;
    totalItems: number;
    totalAmount: number;
    selectedTotalAmount: number;
  }> {
    const cart = await this.getOrCreateCart(userId);

    let totalItems = 0;
    let totalAmount = 0;
    let selectedTotalAmount = 0;

    if (cart.items) {
      for (const item of cart.items) {
        const itemSubtotal = Number(item.product.price) * item.quantity;
        totalItems += item.quantity;
        totalAmount += itemSubtotal;

        if (item.selected) {
          selectedTotalAmount += itemSubtotal;
        }
      }
    }

    return {
      cart,
      totalItems,
      totalAmount,
      selectedTotalAmount,
    };
  }
}
