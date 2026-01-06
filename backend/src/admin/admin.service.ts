import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Seller } from '../sellers/entities/seller.entity';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { DateRangeUtil } from '../common/utils/date-range.util';

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

  async getDashboardStats(
    filters?: QueryDashboardDto,
  ): Promise<DashboardStats> {
    const period = (filters?.period ?? 'month') as
      | 'day'
      | 'week'
      | 'month'
      | 'year';

    const granularity = filters?.granularity;

    // 使用統一的解析工具處理時區與範圍
    const { startDate, endDate } = DateRangeUtil.parseRange(
      filters?.startDate,
      filters?.endDate,
      period === 'day'
        ? 1
        : period === 'week'
          ? 7
          : period === 'month'
            ? 30
            : 365,
    );

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
      this.getTotalRevenue(startDate, endDate),
      this.getTotalUsers(),
      this.getActiveSellers(),
      this.getPendingReviews(),
      this.getRecentActivities(),
      this.getRevenueChartData(startDate, endDate, period, granularity),
      this.getUserGrowthChartData(startDate, endDate, period, granularity),
      this.getOrderStatusChartData(startDate, endDate),
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

  private async getTotalRevenue(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.orderStatus = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .getRawOne<{ total: string | null }>();

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

  private async getRevenueChartData(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month' | 'year',
    granularity?: 'day' | 'week' | 'month' | 'year',
  ): Promise<ChartDataPoint[]> {
    // Get revenue for the specified date range
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('order.createdAt', 'createdAt')
      .addSelect('order.totalAmount', 'totalAmount')
      .where('order.orderStatus = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .orderBy('order.createdAt', 'ASC');

    const orders = await query.getRawMany<{
      createdAt: Date;
      totalAmount: string;
    }>();

    return this.groupDataByPeriod(
      orders,
      startDate,
      endDate,
      period,
      'totalAmount',
      granularity,
    );
  }

  private async getUserGrowthChartData(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month' | 'year',
    granularity?: 'day' | 'week' | 'month' | 'year',
  ): Promise<ChartDataPoint[]> {
    // Get new users for the specified date range
    const query = this.userRepository
      .createQueryBuilder('user')
      .select('user.createdAt', 'createdAt')
      .where('user.createdAt >= :startDate', { startDate })
      .andWhere('user.createdAt <= :endDate', { endDate })
      .orderBy('user.createdAt', 'ASC');

    const users = await query.getRawMany<{ createdAt: Date }>();

    // Add a virtual field 'count' with value 1 for each user to use groupDataByPeriod
    const userData = users.map((u) => ({ ...u, count: 1 }));

    return this.groupDataByPeriod(
      userData,
      startDate,
      endDate,
      period,
      'count',
      granularity,
    );
  }

  private groupDataByPeriod(
    data: any[],
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month' | 'year',
    valueField: string,
    granularity?: 'day' | 'week' | 'month' | 'year',
  ): ChartDataPoint[] {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let effectiveGranularity = granularity;
    if (!effectiveGranularity) {
      if (period === 'day') effectiveGranularity = 'day'; // Admin doesn't have hour yet, keeping it simple
      else if (period === 'week') effectiveGranularity = 'day';
      else if (diffDays <= 31) effectiveGranularity = 'day';
      else if (diffDays <= 366) effectiveGranularity = 'month';
      else effectiveGranularity = 'year';
    }

    // Generate labels and mapping based on effectiveGranularity
    const labels: string[] = [];
    const currentDate = new Date(startDate);

    if (effectiveGranularity === 'day') {
      if (diffDays <= 7 && period === 'week') {
        labels.push('週一', '週二', '週三', '週四', '週五', '週六', '週日');
      } else {
        while (currentDate <= endDate) {
          labels.push(
            `${currentDate.getUTCMonth() + 1}/${currentDate.getUTCDate()}`,
          );
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
      }
    } else if (effectiveGranularity === 'week') {
      const weekStart = new Date(startDate);
      while (weekStart <= endDate) {
        let weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        if (weekEnd > endDate) weekEnd = new Date(endDate);
        labels.push(
          `${weekStart.getUTCMonth() + 1}/${weekStart.getUTCDate()}-${weekEnd.getUTCMonth() + 1}/${weekEnd.getUTCDate()}`,
        );
        weekStart.setUTCDate(weekStart.getUTCDate() + 7);
      }
    } else if (effectiveGranularity === 'month') {
      const startYear = startDate.getUTCFullYear();
      const endYear = endDate.getUTCFullYear();
      const isCrossYear = startYear !== endYear;
      const endTotalMonth = endYear * 12 + endDate.getUTCMonth();
      let currentTotalMonth = startYear * 12 + startDate.getUTCMonth();

      while (currentTotalMonth <= endTotalMonth) {
        const y = Math.floor(currentTotalMonth / 12);
        const m = (currentTotalMonth % 12) + 1;
        labels.push(isCrossYear ? `${y}/${m}` : `${m}月`);
        currentTotalMonth++;
      }
    } else {
      for (
        let year = startDate.getUTCFullYear();
        year <= endDate.getUTCFullYear();
        year++
      ) {
        labels.push(`${year}年`);
      }
    }

    const dataMap = new Map<string, number>();
    data.forEach((item) => {
      const date = new Date(item.createdAt);
      let label: string;

      if (effectiveGranularity === 'day') {
        if (diffDays <= 7 && period === 'week') {
          const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
          label = days[date.getUTCDay()];
        } else {
          label = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
        }
      } else if (effectiveGranularity === 'week') {
        const diffFromStart = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const weekNum = Math.floor(diffFromStart / 7);
        const weekStart = new Date(startDate);
        weekStart.setUTCDate(startDate.getUTCDate() + weekNum * 7);
        let weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        if (weekEnd > endDate) weekEnd = new Date(endDate);
        label = `${weekStart.getUTCMonth() + 1}/${weekStart.getUTCDate()}-${weekEnd.getUTCMonth() + 1}/${weekEnd.getUTCDate()}`;
      } else if (effectiveGranularity === 'month') {
        const y = date.getUTCFullYear();
        const m = date.getUTCMonth() + 1;
        const isCrossYear =
          startDate.getUTCFullYear() !== endDate.getUTCFullYear();
        label = isCrossYear ? `${y}/${m}` : `${m}月`;
      } else {
        label = `${date.getUTCFullYear()}年`;
      }

      const val = parseFloat(item[valueField] || '0');
      dataMap.set(label, (dataMap.get(label) || 0) + val);
    });

    return labels.map((label) => ({
      label,
      value: dataMap.get(label) || 0,
    }));
  }

  private async getOrderStatusChartData(
    startDate: Date,
    endDate: Date,
  ): Promise<ChartDataPoint[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .groupBy('order.orderStatus')
      .getRawMany<{ status: string; count: string }>();

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
