import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderFromSnapshotDto } from './dto/create-order-from-snapshot.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryAdminOrderDto } from './dto/query-admin-order.dto';
import { CartItemsService } from '../carts-item/cart-items.service';
import { ShippingAddressesService } from '../shipping-addresses/shipping-addresses.service';
import { InventoryService } from '../inventory/inventory.service';
import { DiscountsService } from '../discounts/discounts.service';
import { SseService } from '../sse/sse.service';

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
    private readonly sseService: SseService,
  ) {}

  // TODO: 付款等待 清空購物車邏輯
  // 標準下單：從目前購物車建立
  async create(userId: string, createDto: CreateOrderDto): Promise<Order[]> {
    // 1. 從資料庫抓取目前購物車資料
    const summary = await this.cartsService.getCartSummary(userId);
    const cartItems = (summary.cart || []).filter((item: any) => item.selected);

    if (cartItems.length === 0) {
      throw new BadRequestException('No items selected for checkout');
    }

    // 2. 處理地址
    const shippingAddress = await this.shippingAddressesService.findOne(
      createDto.shippingAddressId,
      userId,
    );

    if (!shippingAddress) {
      throw new BadRequestException('Shipping address is required');
    }

    // 3. 呼叫核心邏輯
    const orders = await this.executeOrderCreation(
      userId,
      cartItems,
      shippingAddress,
      createDto,
    );

    // 4. 一般下單完畢後，清理購物車
    try {
      await this.cartsService.removeSelectedItems(userId);
    } catch (err: any) {
      console.warn(
        'Failed to clear cart items after order creation:',
        err?.message || 'Unknown error',
      );
    }

    return orders;
  }

  // 歷史下單：從快照建立 (再次購買等功能)
  async createFromSnapshot(
    userId: string,
    createDto: CreateOrderFromSnapshotDto,
  ): Promise<Order[]> {
    const items = createDto.cartSnapshot?.items || [];
    if (items.length === 0) {
      throw new BadRequestException('No items in snapshot');
    }

    const shippingAddress = createDto.shippingAddressSnapshot;
    if (!shippingAddress) {
      throw new BadRequestException('Shipping address snapshot is required');
    }

    // 直接呼叫核心邏輯，不清理目前的購物車
    return await this.executeOrderCreation(
      userId,
      items,
      shippingAddress,
      createDto,
    );
  }

  /**
   * 核心私有方法：負責事務處理、分組、庫存與資料庫操作
   */
  private async executeOrderCreation(
    userId: string,
    items: any[],
    shippingAddress: any,
    options: CreateOrderDto | CreateOrderFromSnapshotDto,
  ): Promise<Order[]> {
    // 依 storeId 分組
    const itemsByStore = new Map<string, any[]>();
    for (const it of items) {
      const storeId = String(
        it.product?.storeId || it.product?.store?.storeId || '0',
      );
      if (!itemsByStore.has(storeId)) {
        itemsByStore.set(storeId, []);
      }
      itemsByStore.get(storeId)!.push(it);
    }

    const createdOrders: Order[] = [];

    return await this.dataSource.transaction(async (manager) => {
      for (const [storeId, storeItems] of itemsByStore.entries()) {
        let subtotal = 0;

        // 庫存檢查與金額計算
        for (const item of storeItems) {
          const productId = item.productId || item.product?.productId;

          // 庫存預扣
          if (productId) {
            const isAvailable =
              await this.inventoryService.checkStockAvailability(
                productId,
                item.quantity,
              );

            if (!isAvailable) {
              throw new BadRequestException(
                `Insufficient stock for product: ${item.product?.productName || item.product?.product_name || 'Unknown'}`,
              );
            }

            await this.inventoryService.orderCreated(productId, item.quantity);
          }

          subtotal +=
            Number(item.product?.price || 0) * Number(item.quantity || 1);
        }

        const shippingFee = 60;
        const totalAmount = subtotal + shippingFee;
        const orderNumber = this.generateOrderNumber();

        const isCashOnDelivery = options.paymentMethod === 'cash_on_delivery';
        const initialStatus = isCashOnDelivery
          ? OrderStatus.PAID
          : OrderStatus.PENDING_PAYMENT;

        const order = manager.create(Order, {
          orderNumber,
          userId,
          storeId,
          subtotal,
          shippingFee,
          totalDiscount: 0,
          totalAmount,
          paymentMethod: options.paymentMethod || 'credit_card',
          shippingAddressSnapshot: shippingAddress,
          notes: options.notes,
          orderStatus: initialStatus,
        });

        const savedOrder = await manager.save(Order, order);

        for (const item of storeItems) {
          const orderItem = manager.create(OrderItem, {
            orderId: savedOrder.orderId,
            productId: item.productId || item.product?.productId,
            productSnapshot: item.product,
            quantity: item.quantity,
            originalPrice: item.product?.price || 0,
            itemDiscount: 0,
            unitPrice: item.product?.price || 0,
            subtotal:
              Number(item.product?.price || 0) * Number(item.quantity || 1),
          });
          await manager.save(OrderItem, orderItem);
        }

        createdOrders.push(savedOrder);
      }

      // 回傳包含關聯的訂單資料
      const orderIds = createdOrders.map((o) => o.orderId);
      return (await manager.find(Order, {
        where: { orderId: In(orderIds), userId },
        relations: ['store', 'items', 'items.product'],
      })) as Order[];
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

    // Use transaction for status update
    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      await this.applyStatusChange(manager, order, updateDto.status);
      return await manager.save(Order, order);
    });

    // Send SSE notification
    this.notifyOrderUpdate(updatedOrder);

    return updatedOrder;
  }

  /**
   * 統一處理狀態變更的副作用（時間戳、庫存）
   */
  private async applyStatusChange(
    manager: any,
    order: Order,
    newStatus: OrderStatus,
  ): Promise<void> {
    order.orderStatus = newStatus;

    switch (newStatus) {
      case OrderStatus.PAID:
        order.paidAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        order.shippedAt = new Date();
        // 釋放預留庫存（實際出貨）
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
        // 退回預留庫存
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
  }

  /**
   * 統一發送 SSE 通知
   */
  private notifyOrderUpdate(order: Order): void {
    try {
      const sellerIds = order.items
        ? [
            ...new Set(
              order.items
                .map((item) => item.product?.store?.sellerId)
                .filter(Boolean),
            ),
          ]
        : [];

      this.sseService.notifyOrderUpdate(
        order.orderId,
        order.userId,
        sellerIds as string[],
        {
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error('Failed to send SSE notification:', error);
    }
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
      query.andWhere('order.orderStatus = :status', {
        status: queryDto.status,
      });
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

  async adminCancelOrder(id: string, _reason?: string): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      await this.applyStatusChange(manager, order, OrderStatus.CANCELLED);

      // TODO: Send email notification with reason using nodeMailer
      // if (reason) {
      //   await this.mailService.sendOrderCancelledEmail(order, reason);
      // }

      return await manager.save(Order, order);
    });

    this.notifyOrderUpdate(updatedOrder);
    return updatedOrder;
  }

  async updateAdminOrderStatus(
    id: string,
    updateDto: { status: OrderStatus },
  ): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id },
      relations: ['items'], // 需要 items 來處理庫存
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      await this.applyStatusChange(manager, order, updateDto.status);
      return await manager.save(Order, order);
    });

    this.notifyOrderUpdate(updatedOrder);
    return updatedOrder;
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
  async findSellerOrder(sellerId: string, orderId: string): Promise<any> {
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

    // Format the order response with proper item structure
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      userId: order.userId,
      storeId: order.storeId,
      storeName: order.store?.storeName || 'Unknown Store',
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      shippingAddressSnapshot: order.shippingAddressSnapshot,
      notes: order.notes,
      subtotal: parseFloat(order.subtotal.toString()),
      shippingFee: parseFloat(order.shippingFee.toString()),
      totalDiscount: parseFloat(order.totalDiscount.toString()),
      totalAmount: parseFloat(order.totalAmount.toString()),
      items: (order.items || []).map((item) => {
        const snapshot = item.productSnapshot as any;
        return {
          orderItemId: item.orderItemId,
          productId: item.productId,
          productSnapshot: snapshot,
          quantity: item.quantity,
          originalPrice: parseFloat(item.originalPrice.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          subtotal: parseFloat(item.subtotal.toString()),
        };
      }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    };
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

    // Use transaction for status update
    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      if (note) {
        order.notes = note;
      }
      await this.applyStatusChange(manager, order, status);
      return await manager.save(Order, order);
    });

    // Send SSE notification
    this.notifyOrderUpdate(updatedOrder);

    return updatedOrder;
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
