import { ChartDataPoint } from './seller';

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
  type: 'seller_application' | 'product_review' | 'dispute';
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
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
  deleted_at: string | null; // null = active, timestamp = suspended
}

// Seller Application Type
export interface SellerApplication {
  login_id: string;
  user_id: string;
  seller_id: string;
  user_name: string;
  email: string;
  phone_number: string;
  user_created_at: string;
  bank_account_reference: string;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null; // admin user_id

  // Store table
  store_id: string;
  store_name: string;
  store_description: string;
  store_address: string;
  store_email: string;
  store_phone: string;
  store_created_at: string;

  // For rejection tracking (may need custom implementation)
  rejected_at?: string | null;
  rejection_reason?: string | null;
}

// Dispute Type
export interface Dispute {
  dispute_id: string;
  order_number: string;
  buyer_name: string;
  seller_name: string;
  dispute_type: 'not_received' | 'not_as_described' | 'damaged' | 'other';
  description: string;
  buyer_evidence: string;
  seller_response: string | null;
  status: 'pending' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  resolution: {
    type: 'full_refund' | 'partial_refund' | 'reject';
    amount?: number;
    reason: string;
  } | null;
}

// System Discount Type
export interface SystemDiscount {
  discount_id: string;
  discount_code: string;
  discount_type: 'seasonal' | 'shipping';
  name: string;
  description: string;
  min_purchase_amount: number;
  start_datetime: string;
  end_datetime: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_by_type: 'system';
  created_by_id: null;
  created_at: string;
  // Seasonal discount fields
  discount_rate?: number;
  max_discount_amount?: number;
  // Shipping discount field
  discount_amount?: number;
}
