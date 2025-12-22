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
  application_id: string;

  user_id: string;
  user_name: string;
  email: string;
  phone_number: string;

  store_name: string;
  store_description: string;
  store_address: string;
  store_email: string;
  store_phone: string;

  bank_account_reference: string;

  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;

  application_created_at: string;
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
