import type { OrderStatus, PaymentMethod, OrderItemDetail } from "./order";
import type { Address } from "./common";
import type { ChartDataPoint } from "./seller";

// Re-export ChartDataPoint from seller types
export type { ChartDataPoint } from "./seller";

// Dashboard Types
export interface DashboardStats {
  totalRevenue: number;
  totalUsers: number;
  activeSellers: number;
  pendingReviews: number;
  recentActivities: RecentActivity[];
  // Chart data
  revenueChartData: ChartDataPoint[];
  userGrowthChartData: ChartDataPoint[];
  orderStatusChartData: ChartDataPoint[];
}

export interface RecentActivity {
  id: string;
  type: "seller_application" | "product_review" | "order";
  message: string;
  count: number;
  timestamp: string;
}

// Admin User Type (with admin-specific fields)
export interface AdminUser {
  user_id: string;
  login_id: string;
  name: string;
  email: string;
  phone_number: string;
  role: "buyer" | "seller" | "admin";
  created_at: string;
  deleted_at: string | null; // null = active, timestamp = suspended
}

// Admin Store Type (with admin-specific fields)
export interface AdminStore {
  store_id: string;
  store_name: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  description: string;
  address: string;
  email: string;
  phone: string;
  rating: number;
  total_ratings: number;
  product_count: number;
  created_at: string;
  deleted_at: string | null; // null = active, timestamp = suspended
}

// Seller Application Type
export interface SellerApplication {
  seller_id: string;
  user_id: string;

  // User 資訊 (from JOIN)
  login_id: string;
  user_name: string;
  email: string;
  phone_number: string;

  // Seller 資訊
  bank_account_reference: string;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;

  // Timestamps
  created_at: string; // Seller.created_at (申請時間)
  updated_at: string;
}

// System Discount Type
export interface SystemDiscount {
  discount_id: string;
  discount_code: string;
  discount_type: "seasonal" | "shipping";
  name: string;
  description: string;
  min_purchase_amount: number;
  start_datetime: string;
  end_datetime: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_by_type: "system";
  created_by_id: null;
  created_at: string;
  // Seasonal discount fields
  discount_rate?: number;
  max_discount_amount?: number;
  // Shipping discount field
  discount_amount?: number;
}

// Admin Order Management Types
export interface AdminOrder {
  order_id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  store_name: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  items: OrderItemDetail[];
  shipping_address: Address;
  note?: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

// Order Filter Parameters
export interface AdminOrderFilters {
  search?: string; // 訂單編號、買家、賣家
  status?: OrderStatus | "all";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
