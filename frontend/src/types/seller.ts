import { OrderStatus } from './order';

// ========== Sales Period ==========
export type SalesPeriod = 'day' | 'week' | 'month';

// ========== Dashboard Types ==========
export interface DashboardData {
  revenue: number;
  orderCount: number;
  chartData: ChartDataPoint[];
  popularProducts: PopularProduct[];
  recentOrders: RecentOrder[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  image: string;
  salesCount: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

// ========== Store Types ==========
export interface StoreInfo {
  storeName: string;
  storeDescription: string;
  contactPhone: string;
  email: string;
  address: string;
  bankAccount: string;
}

// ========== Product Types ==========
export type ProductStatus = 'active' | 'inactive';

export interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  status: ProductStatus;
  images: string[];
  createdAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: string[];
}

// ========== Discount Types ==========
export interface Discount {
  id: string;
  name: string;
  type: 'special';  // 固定為特殊活動折扣
  description: string;
  categoryId: string;  // 'all' 或具體分類 ID
  discountRate: number;  // 折扣比率 (%)
  maxDiscount?: number;  // 折扣上限 (NT$)
  minPurchase?: number;  // 最低消費 (NT$)
  startDate: string;
  endDate: string;
  usageLimit?: number;  // 使用限制（次數）
  usedCount: number;
  isActive: boolean;
}

export interface DiscountFormData {
  name: string;
  description: string;
  categoryId: string;
  discountRate: number;
  maxDiscount?: number;
  minPurchase?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
}
