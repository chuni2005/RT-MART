import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryAdminOrderDto } from './dto/query-admin-order.dto';
import { CartItemsService } from '../carts-item/cart-items.service';
import { ShippingAddressesService } from '../shipping-addresses/shipping-addresses.service';
import { InventoryService } from '../inventory/inventory.service';
import { DiscountsService } from '../discounts/discounts.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly cartsService: CartItemsService,
    private readonly shippingAddressesService: ShippingAddressesService,
    private readonly inventoryService: InventoryService,
    private readonly discountsService: DiscountsService,
    private readonly dataSource: DataSource,
  ) {}
    async createFromSnapshot(
      userId: string,
      cartSnapshot: any,
      createDto: CreateOrderDto,
    ): Promise<Order[]> {
      // Expect cartSnapshot.items with product (snapshot) and quantity
      const items = cartSnapshot.items || [];
      if (items.length === 0) {
        throw new BadRequestException('No items in snapshot');
      }

      // Group by storeId (try to read from product.storeId or product.store?.storeId)
      const itemsByStore = new Map<string, any[]>();
      for (const it of items) {
        const storeId = String(it.product?.storeId || it.product?.store?.storeId || '0');
        if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
        itemsByStore.get(storeId)!.push(it);
      }

      const createdOrders: Order[] = [];

      return await this.dataSource.transaction(async (manager) => {
        for (const [storeId, storeItems] of itemsByStore.entries()) {
          let subtotal = 0;
          for (const item of storeItems) {
            subtotal += Number(item.product?.price || 0) * Number(item.quantity || 1);
          }

          const shippingFee = 60;
          const totalAmount = subtotal + shippingFee;

          const orderNumber = this.generateOrderNumber();

          const order = manager.create(Order, {
            orderNumber,
            userId,
            storeId,
            subtotal,
            shippingFee,
            totalDiscount: 0,
            totalAmount,
            paymentMethod: createDto?.paymentMethod,
            shippingAddressSnapshot: createDto?.shippingAddressSnapshot,
            notes: createDto?.notes,
            orderStatus: OrderStatus.PENDING_PAYMENT,
          });

          const savedOrder = await manager.save(Order, order);

          for (const item of storeItems) {
            const orderItem = manager.create(OrderItem, {
              orderId: savedOrder.orderId,
              productId: item.productId,
              productSnapshot: item.product,
              quantity: item.quantity,
              originalPrice: item.product?.price || 0,
              itemDiscount: 0,
              unitPrice: item.product?.price || 0,
              subtotal: Number(item.product?.price || 0) * Number(item.quantity || 1),
            });

            await manager.save(OrderItem, orderItem);
          }

          createdOrders.push(savedOrder);
        }

        // Optionally clear selected items in cart
        try {
          await this.cartsService.removeSelectedItems(userId);
        } catch (err) {
          // ignore
        }

        return createdOrders;
      });
    }

  async findAll(
    userId: string,
    queryDto: QueryOrderDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (queryDto.status) {
      where.orderStatus = queryDto.status;
    }

    if (queryDto.storeId) {
      where.storeId = queryDto.storeId;
    }

    // Order list should only return basic info without items for performance
    const [data, total] = await this.orderRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['store'], // Removed 'items' and 'items.product' for performance
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
          // Payment confirmed, inventory already reserved
          break;
        case OrderStatus.SHIPPED:
          order.shippedAt = new Date();
          // Release reserved inventory when shipped
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.orderShipped(
                item.productId,
                item.quantity,
              );
            }
          }
          break;
        case OrderStatus.DELIVERED:
          order.deliveredAt = new Date();
          break;
        case OrderStatus.COMPLETED:
          order.completedAt = new Date();
          break;
        case OrderStatus.CANCELLED:
          order.cancelledAt = new Date();
          // Release reserved inventory (restore quantity, decrease reserved)
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.orderCancel(
                item.productId,
                item.quantity,
              );
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
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  // ========== Admin Methods ==========

  async findAllAdmin(
    queryDto: QueryAdminOrderDto,
  ): Promise<{ data: any[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('store.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'sellerUser')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Search filter (order number, buyer name, seller name, store name)
    if (queryDto.search) {
      query.andWhere(
        '(order.orderNumber LIKE :search OR user.name LIKE :search OR sellerUser.name LIKE :search OR store.storeName LIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    // Status filter
    if (queryDto.status) {
      query.andWhere('order.orderStatus = :status', { status: queryDto.status });
    }

    // Date range filter
    if (queryDto.startDate) {
      query.andWhere('order.createdAt >= :startDate', {
        startDate: queryDto.startDate,
      });
    }
    if (queryDto.endDate) {
      query.andWhere('order.createdAt <= :endDate', {
        endDate: queryDto.endDate,
      });
    }

    const [data, total] = await query.getManyAndCount();

    // Transform to admin-friendly format
    const adminOrders = data.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      buyerId: order.userId,
      buyerName: order.user.name,
      buyerEmail: order.user.email,
      sellerId: order.store.seller.sellerId,
      sellerName: order.store.seller.user.name,
      storeName: order.store.storeName,
      status: order.orderStatus,
      paymentMethod: order.paymentMethod,
      items: (order.items || []).map((item) => {
        const snapshot = item.productSnapshot as any;
        return {
          id: item.orderItemId,
          productId: item.productId,
          productName: snapshot?.product_name || 'Unknown Product',
          productImage: snapshot?.images?.[0] || null,
          quantity: item.quantity,
          price: parseFloat(item.unitPrice.toString()),
        };
      }),
      shippingAddress: order.shippingAddressSnapshot,
      note: order.notes,
      subtotal: order.subtotal,
      shipping: order.shippingFee,
      discount: order.totalDiscount,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    }));

    return { data: adminOrders, total };
  }

  async findOneAdmin(orderId: string): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: [
        'user',
        'store',
        'store.seller',
        'store.seller.user',
        'items',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Transform to admin-friendly format (same as above)
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      buyerId: order.userId,
      buyerName: order.user.name,
      buyerEmail: order.user.email,
      sellerId: order.store.seller.sellerId,
      sellerName: order.store.seller.user.name,
      storeName: order.store.storeName,
      status: order.orderStatus,
      paymentMethod: order.paymentMethod,
      items: (order.items || []).map((item) => {
        const snapshot = item.productSnapshot as any;
        return {
          id: item.orderItemId,
          productId: item.productId,
          productName: snapshot?.product_name || 'Unknown Product',
          productImage: snapshot?.images?.[0] || null,
          quantity: item.quantity,
          price: parseFloat(item.unitPrice.toString()),
        };
      }),
      shippingAddress: order.shippingAddressSnapshot,
      note: order.notes,
      subtotal: order.subtotal,
      shipping: order.shippingFee,
      discount: order.totalDiscount,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    };
  }

  async adminCancelOrder(id: string, reason?: string): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Admin can cancel any order (skip user check)
    return await this.dataSource.transaction(async (manager) => {
      order.orderStatus = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();

      // Release reserved inventory (restore quantity, decrease reserved)
      for (const item of order.items || []) {
        if (item.productId) {
          await this.inventoryService.orderCancel(item.productId, item.quantity);
        }
      }

      // TODO: Send email notification with reason using nodeMailer
      // if (reason) {
      //   await this.mailService.sendOrderCancelledEmail(order, reason);
      // }

      return await manager.save(Order, order);
    });
  }

  async updateAdminOrderStatus(
    id: string,
    updateDto: { status: OrderStatus },
  ): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Admin can update to any status (skip status transition validation)
    return await this.dataSource.transaction(async (manager) => {
      order.orderStatus = updateDto.status;

      // Update corresponding timestamp based on new status
      switch (updateDto.status) {
        case OrderStatus.PAID:
          order.paidAt = new Date();
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
          // Release reserved inventory (restore quantity, decrease reserved)
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.orderCancel(
                item.productId,
                item.quantity,
              );
            }
          }
          break;
      }

      return await manager.save(Order, order);
    });
  }

  async findAnomalies(): Promise<any[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const anomalies = await this.orderRepository.find({
      where: {
        orderStatus: OrderStatus.PENDING_PAYMENT,
        createdAt: LessThan(twentyFourHoursAgo),
      },
      relations: ['user', 'store', 'store.seller', 'store.seller.user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Format response similar to findAllAdmin
    return anomalies.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      buyerName: order.user?.name,
      buyerEmail: order.user?.email,
      sellerName: order.store?.seller?.user?.name,
      storeName: order.store?.storeName,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    }));
  }

  // ========== Seller Methods ==========

  /**
   * Get orders for a specific seller's store
   * Returns basic order info without items for performance
   */
  async findSellerOrders(
    sellerId: string,
    queryDto: QueryOrderDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Build query - removed items and product relations for performance
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('store.seller', 'seller')
      .leftJoinAndSelect('order.user', 'user')
      // Removed items and product joins - use findSellerOrder() for details
      .where('seller.sellerId = :sellerId', { sellerId })
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply status filter if provided
    if (queryDto.status) {
      query.andWhere('order.orderStatus = :status', {
        status: queryDto.status,
      });
    }

    // Apply store filter if provided (seller might have multiple stores in future)
    if (queryDto.storeId) {
      query.andWhere('order.storeId = :storeId', { storeId: queryDto.storeId });
    }

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  /**
   * Get single order detail for seller
   */
  async findSellerOrder(sellerId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['store', 'store.seller', 'user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify order belongs to seller's store
    if (order.store?.seller?.sellerId !== sellerId) {
      throw new BadRequestException(
        'You do not have permission to access this order',
      );
    }

    return order;
  }

  /**
   * Update order status by seller
   * Sellers can only update to: PROCESSING, SHIPPED, DELIVERED, CANCELLED
   * Sellers cannot mark orders as COMPLETED (user-only action)
   */
  async updateSellerOrderStatus(
    sellerId: string,
    orderId: string,
    status: OrderStatus,
    note?: string,
  ): Promise<Order> {
    // Get order and verify ownership
    const order = await this.findSellerOrder(sellerId, orderId);

    // Validate seller can make this status transition
    this.validateSellerStatusTransition(order.orderStatus, status);

    // Use transaction for status update with inventory changes
    return await this.dataSource.transaction(async (manager) => {
      order.orderStatus = status;
      if (note) {
        order.notes = note;
      }

      // Update timestamps based on status
      switch (status) {
        case OrderStatus.SHIPPED:
          order.shippedAt = new Date();
          // Release reserved inventory when shipped
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.orderShipped(
                item.productId,
                item.quantity,
              );
            }
          }
          break;
        case OrderStatus.DELIVERED:
          order.deliveredAt = new Date();
          break;
        case OrderStatus.CANCELLED:
          order.cancelledAt = new Date();
          // Release reserved inventory (restore quantity, decrease reserved)
          for (const item of order.items || []) {
            if (item.productId) {
              await this.inventoryService.orderCancel(
                item.productId,
                item.quantity,
              );
            }
          }
          break;
      }

      return await manager.save(Order, order);
    });
  }

  /**
   * Validate seller can make this status transition
   * Sellers can transition:
   * - PAID → PROCESSING, CANCELLED
   * - PROCESSING → SHIPPED, CANCELLED
   * - SHIPPED → DELIVERED, CANCELLED
   * - DELIVERED → CANCELLED (but NOT to COMPLETED)
   */
  private validateSellerStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    // Sellers cannot mark orders as COMPLETED
    if (newStatus === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Sellers cannot mark orders as completed. Only customers can confirm delivery.',
      );
    }

    // Define valid transitions for sellers
    const validSellerTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [],
      [OrderStatus.PAYMENT_FAILED]: [],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validSellerTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Sellers cannot transition order from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
