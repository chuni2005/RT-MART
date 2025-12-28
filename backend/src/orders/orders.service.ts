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
import { CartsService } from '../carts/carts.service';
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
    private readonly cartsService: CartsService,
    private readonly shippingAddressesService: ShippingAddressesService,
    private readonly inventoryService: InventoryService,
    private readonly discountsService: DiscountsService,
    private readonly dataSource: DataSource,
  ) {}

  // TODO: 付款等待 清空購物車邏輯
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
      // Filter only selected items and group items by store
      const cartItems = cart.items!.filter((item) => item.selected);

      if (cartItems.length === 0) {
        throw new BadRequestException('No items selected for checkout');
      }

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

        // Calculate subtotal and reserve inventory for all items
        for (const item of items) {
          // Check stock availability
          const isAvailable = await this.inventoryService.checkStockAvailability(
            item.productId,
            item.quantity,
          );

          if (!isAvailable) {
            throw new BadRequestException(
              `Insufficient stock for product: ${item.product.productName}`,
            );
          }

          // Reserve inventory (decrease quantity, increase reserved)
          await this.inventoryService.orderCreated(
            item.productId,
            item.quantity,
          );

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
              product_name: item.product.productName,
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

      // Clear only selected items after successful order creation (within transaction)
      await this.cartsService.removeSelectedItems(userId);

      // Return first order (or implement logic to return all orders)
      // return await this.findOne(orders[0].orderId, userId);
      // 使用交易內的 manager 來獲取完整訂單資訊，避免交易尚未 commit 導致 findOne 找不到資料
      return (await manager.findOne(Order, {
        where: { orderId: orders[0].orderId, userId },
        relations: ['store', 'items', 'items.product'],
      })) as Order;
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
}
