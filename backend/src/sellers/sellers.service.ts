import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './entities/seller.entity';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { RejectSellerDto } from './dto/reject-seller.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { QuerySellerDto } from './dto/query-seller.dto';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { QuerySellerDashboardDto } from './dto/query-seller-dashboard.dto';
import { SalesReportItemDto } from './dto/sales-report-item.dto';
import { MailService } from '../mail/mail.service';

export interface DashboardData {
  revenue: number;
  orderCount: number;
  chartData: ChartDataPoint[];
  categoryData: CategoryDataPoint[];
  popularProducts: PopularProduct[];
  recentOrders: RecentOrderData[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface CategoryDataPoint {
  label: string;
  value: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  image: string | null;
  salesCount: number;
  revenue: number;
}

export interface RecentOrderData {
  id: string;
  orderNumber: string;
  buyerName: string;
  itemCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async create(createSellerDto: CreateSellerDto): Promise<Seller> {
    if (!createSellerDto.userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.usersService.findOne(createSellerDto.userId);

    if (!user || user.role == UserRole.ADMIN || user.role == UserRole.SELLER) {
      throw new BadRequestException('Only buyers can become sellers');
    }

    const existingSeller = await this.findByUserId(createSellerDto.userId);

    // If existing seller found
    if (existingSeller) {
      // If already verified, can't apply again
      if (existingSeller.verified) {
        throw new ConflictException('您已經是賣家了');
      }

      // If rejected, check if 30 days have passed
      if (existingSeller.rejectedAt) {
        const daysSinceRejection = Math.floor(
          (Date.now() - new Date(existingSeller.rejectedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysSinceRejection < 30) {
          throw new BadRequestException(
            `您的申請已被拒絕，請於 ${30 - daysSinceRejection} 天後重新申請`,
          );
        }

        // Reuse existing record - reset status
        existingSeller.verified = false;
        existingSeller.verifiedAt = null;
        existingSeller.verifiedBy = null;
        existingSeller.rejectedAt = null;
        existingSeller.bankAccountReference =
          createSellerDto.bankAccountReference || null;
        existingSeller.updatedAt = new Date();

        return await this.sellerRepository.save(existingSeller);
      }

      // Already has pending application
      throw new ConflictException('您已經有一個待審核的申請，請等待審核結果');
    }

    // Create new seller
    const seller = this.sellerRepository.create(createSellerDto);
    const savedSeller = await this.sellerRepository.save(seller);

    return savedSeller;
  }

  async findAll(
    queryDto: QuerySellerDto,
  ): Promise<{ data: Seller[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = this.sellerRepository
      .createQueryBuilder('seller')
      .leftJoinAndSelect('seller.user', 'user')
      .orderBy('seller.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (queryDto.loginId) {
      query.andWhere('user.loginId = :loginId', { loginId: queryDto.loginId });
    }

    // Filter by status
    if (queryDto.status) {
      if (queryDto.status === 'pending') {
        query.andWhere('seller.verified = :verified', { verified: false });
        query.andWhere('seller.rejectedAt IS NULL');
      } else if (queryDto.status === 'approved') {
        query.andWhere('seller.verified = :verified', { verified: true });
      } else if (queryDto.status === 'rejected') {
        query.andWhere('seller.rejectedAt IS NOT NULL');
      }
    }

    // Legacy support for verified parameter
    if (queryDto.verified !== undefined) {
      query.andWhere('seller.verified = :verified', {
        verified: queryDto.verified,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(sellerId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { sellerId: sellerId },
      relations: ['user', 'verifier'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return seller;
  }

  async findByUserId(userId: string): Promise<Seller | null> {
    return await this.sellerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(
    sellerId: string,
    updateSellerDto: UpdateSellerDto,
  ): Promise<Seller> {
    const seller = await this.findOne(sellerId);
    Object.assign(seller, updateSellerDto);
    return await this.sellerRepository.save(seller);
  }

  async verify(sellerId: string, verifier: string) {
    const seller = await this.findOne(sellerId);
    const user = await this.usersService.findOne(seller.userId);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    if (seller.rejectedAt) {
      throw new ConflictException('Seller application has been rejected');
    }

    user.role = UserRole.SELLER;
    seller.verified = true;
    seller.verifiedAt = new Date();
    seller.verifiedBy = verifier;
    seller.updatedAt = new Date();

    // 创建默认商店
    const storeName = `${user.name}'s Store`;
    const defaultStore = this.storeRepository.create({
      sellerId: seller.sellerId,
      storeName: storeName,
      storeDescription: 'Default store created upon seller verification',
      storeAddress: null,
      storeEmail: null,
      storePhone: null,
      averageRating: 0,
      totalRatings: 0,
    });

    await this.sellerRepository.save(seller);
    await this.userRepository.save(user);
    return await this.storeRepository.save(defaultStore);
  }

  async reject(sellerId: string, rejectDto: RejectSellerDto): Promise<Seller> {
    const seller = await this.findOne(sellerId);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    if (seller.rejectedAt) {
      throw new ConflictException('Seller is already rejected');
    }

    seller.rejectedAt = new Date();
    seller.updatedAt = new Date();

    // Send rejection email to applicant
    try {
      await this.mailService.sendSellerApplicationRejection(
        seller.user.email,
        seller.user.name,
        rejectDto.reason,
      );
    } catch (error) {
      // Log error but don't fail the rejection process
      console.error('Failed to send rejection email:', error);
    }

    return await this.sellerRepository.save(seller);
  }

  async remove(sellerId: string): Promise<void> {
    const seller = await this.findOne(sellerId);
    if (seller.verified) {
      throw new ConflictException('Seller is already verified'); //already have a store
    }

    await this.sellerRepository.remove(seller);
  }

  // ========== Dashboard Methods ==========

  async getDashboardData(
    userId: string,
    filters: {
      period?: 'day' | 'week' | 'month';
      startDate?: string;
      endDate?: string;
      productName?: string;
    },
  ): Promise<DashboardData> {
    // Get seller's store
    const seller = await this.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const store = await this.storeRepository.findOne({
      where: { sellerId: seller.sellerId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const storeId = store.storeId;

    // Calculate date range with priority: explicit dates > period > default
    let startDate: Date;
    let endDate: Date = new Date();
    let period: 'day' | 'week' | 'month' = filters.period || 'week';

    if (filters.startDate && filters.endDate) {
      startDate = new Date(filters.startDate);
      endDate = new Date(filters.endDate);
    } else if (filters.period) {
      const now = new Date();
      switch (filters.period) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
    } else {
      // Default: last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    // Fetch all dashboard data in parallel
    const [
      revenue,
      orderCount,
      chartData,
      categoryData,
      popularProducts,
      recentOrders,
    ] = await Promise.all([
      this.getRevenue(storeId, startDate, endDate, filters.productName),
      this.getOrderCount(storeId, startDate, endDate, filters.productName),
      this.getChartData(
        storeId,
        startDate,
        endDate,
        period,
        filters.productName,
      ),
      this.getCategoryData(storeId, startDate, endDate, filters.productName),
      this.getPopularProducts(storeId, startDate, endDate, filters.productName),
      this.getRecentOrders(storeId),
    ]);

    return {
      revenue,
      orderCount,
      chartData,
      categoryData,
      popularProducts,
      recentOrders,
    };
  }

  private async getRevenue(
    storeId: string,
    startDate: Date,
    endDate: Date,
    productName?: string,
  ): Promise<number> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ],
      });

    if (productName) {
      query
        .leftJoin('order.items', 'item')
        .andWhere(
          "JSON_UNQUOTE(JSON_EXTRACT(item.product_snapshot, '$.product_name')) LIKE :productName",
          {
            productName: `%${productName}%`,
          },
        );
    }

    const result = await query.getRawOne();
    return parseFloat(result?.total || '0');
  }

  private async getOrderCount(
    storeId: string,
    startDate: Date,
    endDate: Date,
    productName?: string,
  ): Promise<number> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ],
      });

    if (productName) {
      query
        .leftJoin('order.items', 'item')
        .andWhere(
          "JSON_UNQUOTE(JSON_EXTRACT(item.product_snapshot, '$.product_name')) LIKE :productName",
          {
            productName: `%${productName}%`,
          },
        );
    }

    return await query.getCount();
  }

  private async getChartData(
    storeId: string,
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
    productName?: string,
  ): Promise<ChartDataPoint[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('order.createdAt', 'createdAt')
      .addSelect('order.totalAmount', 'totalAmount')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ],
      });

    if (productName) {
      query
        .leftJoin('order.items', 'item')
        .andWhere(
          "JSON_UNQUOTE(JSON_EXTRACT(item.product_snapshot, '$.product_name')) LIKE :productName",
          {
            productName: `%${productName}%`,
          },
        );
    }

    const orders = await query.getRawMany();

    // Group by time period
    const dataMap = new Map<string, number>();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      let label: string;

      if (period === 'day') {
        label = `${date.getHours()}:00`;
      } else if (period === 'week') {
        const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        label = days[date.getDay()];
      } else {
        label = `${date.getDate()}日`;
      }

      const current = dataMap.get(label) || 0;
      dataMap.set(label, current + parseFloat(order.totalAmount));
    });

    // Generate labels based on period
    let labels: string[] = [];
    if (period === 'day') {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (period === 'week') {
      labels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    } else {
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
    }

    return labels.map((label) => ({
      label,
      value: dataMap.get(label) || 0,
    }));
  }

  private async getCategoryData(
    storeId: string,
    startDate: Date,
    endDate: Date,
    productName?: string,
  ): Promise<CategoryDataPoint[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.productType', 'productType')
      .select('productType.typeName', 'label')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'value')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ],
      })
      .groupBy('productType.productTypeId');

    if (productName) {
      query.andWhere(
        "item.productSnapshot->>'product_name' LIKE :productName",
        {
          productName: `%${productName}%`,
        },
      );
    }

    const result = await query.getRawMany();

    return result.map((r) => ({
      label: r.label || '未分類',
      value: parseFloat(r.value || '0'),
    }));
  }

  private async getPopularProducts(
    storeId: string,
    startDate: Date,
    endDate: Date,
    productName?: string,
  ): Promise<PopularProduct[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.images', 'image')
      .select('product.productId', 'id')
      .addSelect('product.productName', 'name')
      .addSelect('MIN(image.imageUrl)', 'image')
      .addSelect('SUM(item.quantity)', 'salesCount')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'revenue')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ],
      })
      .groupBy('product.productId')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5);

    if (productName) {
      query.andWhere(
        "item.productSnapshot->>'product_name' LIKE :productName",
        {
          productName: `%${productName}%`,
        },
      );
    }

    const result = await query.getRawMany();

    return result.map((r) => ({
      id: r.id,
      name: r.name,
      image: r.image || null,
      salesCount: parseInt(r.salesCount || '0'),
      revenue: parseFloat(r.revenue || '0'),
    }));
  }

  private async getRecentOrders(storeId: string): Promise<RecentOrderData[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.storeId = :storeId', { storeId })
      .orderBy('order.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return orders.map((order) => ({
      id: order.orderId,
      orderNumber: order.orderNumber,
      buyerName: order.user?.name || 'Unknown',
      itemCount: order.items?.length || 0,
      totalAmount: parseFloat(order.totalAmount.toString()),
      status: order.orderStatus,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  // ========== Sales Report Methods ==========

  async generateSalesReport(
    userId: string,
    filters: QuerySellerDashboardDto,
  ): Promise<string> {
    // Get seller's store
    const seller = await this.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const store = await this.storeRepository.findOne({
      where: { sellerId: seller.sellerId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const storeId = store.storeId;

    // Calculate date range (default: last 30 days)
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Valid order statuses (exclude pending_payment, cancelled, payment_failed)
    const validStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
    ];

    // Build query to join Order → OrderItem → OrderDiscount → Discount
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('order.orderDiscounts', 'orderDiscount')
      .leftJoinAndSelect('orderDiscount.discount', 'discount')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: validStatuses,
      })
      .orderBy('order.createdAt', 'DESC');

    // Add product name filter if provided
    if (filters.productName) {
      queryBuilder.andWhere(
        "item.productSnapshot->>'product_name' LIKE :productName",
        { productName: `%${filters.productName}%` },
      );
    }

    const orders = await queryBuilder.getMany();

    // Generate CSV rows
    const csvRows: SalesReportItemDto[] = [];

    orders.forEach((order) => {
      const discountCode =
        order.orderDiscounts?.[0]?.discount?.discountCode || null;

      order.items.forEach((item) => {
        const productSnapshot = item.productSnapshot as any;
        const productName = productSnapshot?.product_name || 'Unknown';

        const subtotalValue = parseFloat(item.subtotal.toString());
        const paymentFee = parseFloat((subtotalValue * 0.01).toFixed(2));
        const netAmount = parseFloat((subtotalValue - paymentFee).toFixed(2));

        csvRows.push({
          // 訂單資訊
          orderDate: this.formatDateTime(order.createdAt),
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,

          // 商品資訊
          productName,
          quantity: item.quantity,

          // 價格明細
          originalPrice: parseFloat(item.originalPrice.toString()),
          itemDiscount: parseFloat(item.itemDiscount.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          itemSubtotal: parseFloat(item.originalPrice.toString()) * item.quantity,
          subtotal: subtotalValue,

          // 財務計算
          paymentFee,
          netAmount,

          // 訂單層級資訊
          shippingFee: parseFloat(order.shippingFee.toString()),
          totalDiscount: parseFloat(order.totalDiscount.toString()),
          discountCode,
          paymentMethod: order.paymentMethod || 'Unknown',
        });
      });
    });

    // Convert to CSV string
    const csv = this.convertToCSV(csvRows);

    return csv;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  private convertToCSV(data: SalesReportItemDto[]): string {
    const headers = [
      // 訂單識別
      '訂單日期',
      '訂單編號',
      '訂單狀態',
      // 商品詳情
      '商品名稱',
      '銷售數量',
      // 價格明細
      '商品原價',
      '商品折扣',
      '實際單價',
      '原始小計',
      '折後小計',
      // 財務分解
      '金流手續費',
      '淨額',
      // 訂單層級
      '運費',
      '訂單總折扣',
      '使用折扣代碼',
      '付款方式',
    ];

    const rows = data.map((item) => [
      // 訂單識別
      item.orderDate,
      item.orderNumber,
      item.orderStatus,
      // 商品詳情
      item.productName,
      item.quantity.toString(),
      // 價格明細
      item.originalPrice.toFixed(2),
      item.itemDiscount.toFixed(2),
      item.unitPrice.toFixed(2),
      item.itemSubtotal.toFixed(2),
      item.subtotal.toFixed(2),
      // 財務分解
      item.paymentFee.toFixed(2),
      item.netAmount.toFixed(2),
      // 訂單層級
      item.shippingFee.toFixed(2),
      item.totalDiscount.toFixed(2),
      item.discountCode || '',
      item.paymentMethod,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    return '\uFEFF' + csvContent;
  }
}
