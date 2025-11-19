import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CartsService } from '../carts/carts.service';
import { ShippingAddressesService } from '../shipping-addresses/shipping-addresses.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly cartsService: CartsService,
    private readonly shippingAddressesService: ShippingAddressesService,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, createDto: CreateOrderDto): Promise<Order> {
    // Get cart with items (outside transaction)
    const { cart } = await this.cartsService.getCartSummary(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Get shipping address (outside transaction)
    const shippingAddress = await this.shippingAddressesService.findOne(
      createDto.shippingAddressId,
      userId,
    );

    // Use transaction for order creation
    return await this.dataSource.transaction(async (manager) => {
      // Group items by store
      const cartItems = cart.items!; // Safe because we checked above
      const itemsByStore = new Map<string, typeof cartItems>();
      for (const item of cartItems) {
        const storeId = item.product.storeId;
        if (!itemsByStore.has(storeId)) {
          itemsByStore.set(storeId, []);
        }
        itemsByStore.get(storeId)!.push(item);
      }

      const orders: Order[] = [];

      // Create one order per store
      for (const [storeId, items] of itemsByStore.entries()) {
        let subtotal = 0;

        // Reserve inventory for all items
        for (const item of items) {
          await this.inventoryService.reserveStock(item.productId, {
            quantity: item.quantity,
          });
          subtotal += Number(item.product.price) * item.quantity;
        }

        const shippingFee = 60; // Default shipping fee
        const totalAmount = subtotal + shippingFee;

        // Generate order number
        const orderNumber = this.generateOrderNumber();

        // Create order
        const order = manager.create(Order, {
          orderNumber,
          userId,
          storeId,
          subtotal,
          shippingFee,
          totalDiscount: 0,
          totalAmount,
          paymentMethod: createDto.paymentMethod,
          shippingAddressSnapshot: shippingAddress,
          notes: createDto.notes,
          orderStatus: OrderStatus.PENDING_PAYMENT,
        });

        const savedOrder = await manager.save(Order, order);

        // Create order items
        for (const item of items) {
          const orderItem = manager.create(OrderItem, {
            orderId: savedOrder.orderId,
            productId: item.productId,
            productSnapshot: {
              productId: item.product.productId,
              productName: item.product.productName,
              price: item.product.price,
              images: item.product.images,
            },
            quantity: item.quantity,
            originalPrice: item.product.price,
            itemDiscount: 0,
            unitPrice: item.product.price,
            subtotal: Number(item.product.price) * item.quantity,
          });

          await manager.save(OrderItem, orderItem);
        }

        orders.push(savedOrder);
      }

      // Clear cart after successful order creation (within transaction)
      await this.cartsService.clearCart(userId);

      // Return first order (or implement logic to return all orders)
      return await this.findOne(orders[0].orderId, userId);
    });
  }

  async findAll(
    userId: string,
    queryDto: QueryOrderDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, string> = { userId };

    if (queryDto.status) {
      where.orderStatus = queryDto.status;
    }

    if (queryDto.storeId) {
      where.storeId = queryDto.storeId;
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['store', 'items', 'items.product'],
    });

    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id, userId },
      relations: ['store', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(
    id: string,
    userId: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Validate status transition
    this.validateStatusTransition(order.orderStatus, updateDto.status);

    // Use transaction for status update with inventory changes
    return await this.dataSource.transaction(async (manager) => {
      order.orderStatus = updateDto.status;

      // Update timestamps based on status
      switch (updateDto.status) {
        case OrderStatus.PAID:
          order.paidAt = new Date();
          // Commit reserved inventory
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.commitReserved(
                item.productId,
                item.quantity,
              );
            }
          }
          break;
        case OrderStatus.SHIPPED:
          order.shippedAt = new Date();
          break;
        case OrderStatus.DELIVERED:
          order.deliveredAt = new Date();
          break;
        case OrderStatus.COMPLETED:
          order.completedAt = new Date();
          break;
        case OrderStatus.CANCELLED:
          order.cancelledAt = new Date();
          // Release reserved inventory
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.releaseReserved(item.productId, {
                quantity: item.quantity,
              });
            }
          }
          break;
      }

      return await manager.save(Order, order);
    });
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    return await this.updateStatus(id, userId, {
      status: OrderStatus.CANCELLED,
    });
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.PAID,
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
