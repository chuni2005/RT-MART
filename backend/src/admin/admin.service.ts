import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Seller } from '../sellers/entities/seller.entity';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface RecentActivity {
  id: string;
  type: 'seller_application' | 'product_review' | 'order';
  message: string;
  count: number;
  timestamp: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalUsers: number;
  activeSellers: number;
  pendingReviews: number;
  recentActivities: RecentActivity[];
  revenueChartData: ChartDataPoint[];
  userGrowthChartData: ChartDataPoint[];
  orderStatusChartData: ChartDataPoint[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Get basic statistics
    const [
      totalRevenue,
      totalUsers,
      activeSellers,
      pendingReviews,
      recentActivities,
      revenueChartData,
      userGrowthChartData,
      orderStatusChartData,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.getTotalUsers(),
      this.getActiveSellers(),
      this.getPendingReviews(),
      this.getRecentActivities(),
      this.getRevenueChartData(),
      this.getUserGrowthChartData(),
      this.getOrderStatusChartData(),
    ]);

    return {
      totalRevenue,
      totalUsers,
      activeSellers,
      pendingReviews,
      recentActivities,
      revenueChartData,
      userGrowthChartData,
      orderStatusChartData,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.orderStatus = :status', { status: OrderStatus.COMPLETED })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getTotalUsers(): Promise<number> {
    return await this.userRepository.count();
  }

  private async getActiveSellers(): Promise<number> {
    return await this.sellerRepository.count({
      where: { verified: true },
    });
  }

  private async getPendingReviews(): Promise<number> {
    // Count pending seller applications (not verified and not rejected)
    return await this.sellerRepository.count({
      where: { verified: false, rejectedAt: IsNull() },
    });
  }

  private async getRecentActivities(): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Pending seller applications
    const pendingSellers = await this.sellerRepository.count({
      where: { verified: false, rejectedAt: IsNull() },
    });
    if (pendingSellers > 0) {
      activities.push({
        id: '1',
        type: 'seller_application',
        message: '新賣家申請',
        count: pendingSellers,
        timestamp: new Date().toISOString(),
      });
    }

    // Pending payment orders (anomalies)
    const pendingPaymentOrders = await this.orderRepository.count({
      where: { orderStatus: OrderStatus.PENDING_PAYMENT },
    });
    if (pendingPaymentOrders > 0) {
      activities.push({
        id: '2',
        type: 'order',
        message: '待付款訂單',
        count: pendingPaymentOrders,
        timestamp: new Date().toISOString(),
      });
    }

    // Processing orders
    const processingOrders = await this.orderRepository.count({
      where: { orderStatus: OrderStatus.PROCESSING },
    });
    if (processingOrders > 0) {
      activities.push({
        id: '3',
        type: 'order',
        message: '處理中訂單',
        count: processingOrders,
        timestamp: new Date().toISOString(),
      });
    }

    return activities;
  }

  private async getRevenueChartData(): Promise<ChartDataPoint[]> {
    // Get revenue for the last 12 months
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select("DATE_FORMAT(order.createdAt, '%Y-%m')", 'month')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.orderStatus = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      label: row.month,
      value: parseFloat(row.revenue || '0'),
    }));
  }

  private async getUserGrowthChartData(): Promise<ChartDataPoint[]> {
    // Get new users for the last 12 months
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE_FORMAT(user.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      label: row.month,
      value: parseInt(row.count || '0', 10),
    }));
  }

  private async getOrderStatusChartData(): Promise<ChartDataPoint[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.orderStatus')
      .getRawMany();

    // Map status to Chinese labels
    const statusLabelMap: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING_PAYMENT]: '待付款',
      [OrderStatus.PROCESSING]: '處理中',
      [OrderStatus.SHIPPED]: '配送中',
      [OrderStatus.DELIVERED]: '已送達',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
    };

    return result.map((row) => ({
      label: statusLabelMap[row.status as OrderStatus] || row.status,
      value: parseInt(row.count || '0', 10),
    }));
  }
}
