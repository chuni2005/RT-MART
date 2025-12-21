// import api from './api'; // TODO: 當實作真實 API 時取消註解
import type {
  DashboardStats,
  User,
  SellerApplication,
  Dispute,
  SystemDiscount,
} from '@/types/admin';

/**
 * 管理員服務層
 * 提供所有管理員相關的 API 調用
 */

/**
 * 模擬網路延遲
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ========== Dashboard ==========

/**
 * 獲取 Dashboard 統計數據
 * TODO: 替換為 GET /api/v1/admin/dashboard/stats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  await delay(500);
  return { ...mockDashboardStats };
};

// ========== Users Management ==========

/**
 * 獲取使用者列表
 * TODO: 替換為 GET /api/v1/admin/users
 */
export const getUsers = async (params?: {
  search?: string;
  role?: 'buyer' | 'seller' | 'all';
}): Promise<{ users: User[]; total: number }> => {
  await delay(400);

  let filteredUsers = [...mockUsers];

  // 搜尋篩選
  if (params?.search) {
    const search = params.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.login_id.toLowerCase().includes(search) ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
    );
  }

  // 角色篩選
  if (params?.role && params.role !== 'all') {
    filteredUsers = filteredUsers.filter((user) => user.role === params.role);
  }

  return {
    users: filteredUsers,
    total: filteredUsers.length,
  };
};

/**
 * 停權使用者
 * TODO: 替換為 PUT /api/v1/admin/users/:userId/suspend
 */
export const suspendUser = async (
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  const user = mockUsers.find((u) => u.user_id === userId);
  if (!user) throw new Error('使用者不存在');

  user.deleted_at = new Date().toISOString();

  return {
    success: true,
    message: '使用者已停權',
  };
};

/**
 * 解除停權
 * TODO: 替換為 PUT /api/v1/admin/users/:userId/unsuspend
 */
export const unsuspendUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  const user = mockUsers.find((u) => u.user_id === userId);
  if (!user) throw new Error('使用者不存在');

  user.deleted_at = null;

  return {
    success: true,
    message: '已解除停權',
  };
};

/**
 * 刪除使用者
 * TODO: 替換為 DELETE /api/v1/admin/users/:userId
 */
export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  const index = mockUsers.findIndex((u) => u.user_id === userId);
  if (index === -1) throw new Error('使用者不存在');

  mockUsers.splice(index, 1);

  return {
    success: true,
    message: '使用者已刪除',
  };
};

// ========== Seller Applications ==========

/**
 * 獲取賣家申請列表
 * TODO: 替換為 GET /api/v1/admin/seller-applications
 */
export const getSellerApplications = async (params?: {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
}): Promise<SellerApplication[]> => {
  await delay(400);

  let filtered = [...mockSellerApplications];

  if (params?.status && params.status !== 'all') {
    filtered = filtered.filter((app) => {
      if (params.status === 'pending') return !app.verified && !app.rejected_at;
      if (params.status === 'approved') return app.verified;
      if (params.status === 'rejected') return !!app.rejected_at;
      return true;
    });
  }

  return filtered;
};

/**
 * 批准賣家申請
 * TODO: 替換為 POST /api/v1/admin/seller-applications/:sellerId/approve
 */
export const approveSellerApplication = async (
  sellerId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(500);

  const application = mockSellerApplications.find((a) => a.seller_id === sellerId);
  if (!application) throw new Error('申請不存在');

  application.verified = true;
  application.verified_at = new Date().toISOString();
  application.verified_by = 'admin001'; // 當前管理員 ID

  return {
    success: true,
    message: '賣家申請已批准',
  };
};

/**
 * 拒絕賣家申請
 * TODO: 替換為 POST /api/v1/admin/seller-applications/:sellerId/reject
 */
export const rejectSellerApplication = async (
  sellerId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  await delay(500);

  const application = mockSellerApplications.find((a) => a.seller_id === sellerId);
  if (!application) throw new Error('申請不存在');

  application.rejected_at = new Date().toISOString();
  application.rejection_reason = reason;

  return {
    success: true,
    message: '已拒絕賣家申請',
  };
};

// ========== Disputes ==========

/**
 * 獲取訂單爭議列表
 * TODO: 替換為 GET /api/v1/admin/disputes
 */
export const getDisputes = async (params?: {
  status?: 'pending' | 'resolved' | 'all';
}): Promise<Dispute[]> => {
  await delay(400);

  let filtered = [...mockDisputes];

  if (params?.status && params.status !== 'all') {
    filtered = filtered.filter((d) => d.status === params.status);
  }

  return filtered;
};

/**
 * 判決訂單爭議
 * TODO: 替換為 POST /api/v1/admin/disputes/:disputeId/resolve
 */
export const resolveDispute = async (
  disputeId: string,
  resolution: {
    type: 'full_refund' | 'partial_refund' | 'reject';
    amount?: number;
    reason: string;
  }
): Promise<{ success: boolean; message: string }> => {
  await delay(500);

  const dispute = mockDisputes.find((d) => d.dispute_id === disputeId);
  if (!dispute) throw new Error('爭議不存在');

  dispute.status = 'resolved';
  dispute.resolved_at = new Date().toISOString();
  dispute.resolution = resolution;

  return {
    success: true,
    message: '爭議已判決',
  };
};

// ========== System Discounts ==========

/**
 * 獲取系統折扣列表
 * TODO: 替換為 GET /api/v1/admin/discounts
 */
export const getSystemDiscounts = async (): Promise<SystemDiscount[]> => {
  await delay(400);
  return [...mockSystemDiscounts];
};

/**
 * 創建系統折扣
 * TODO: 替換為 POST /api/v1/admin/discounts
 */
export const createSystemDiscount = async (
  discountData: Omit<
    SystemDiscount,
    'discount_id' | 'usage_count' | 'created_at' | 'created_by_type' | 'created_by_id'
  >
): Promise<SystemDiscount> => {
  await delay(500);

  const newDiscount: SystemDiscount = {
    discount_id: `disc_${Date.now()}`,
    ...discountData,
    usage_count: 0,
    created_by_type: 'system',
    created_by_id: null,
    created_at: new Date().toISOString(),
  };

  mockSystemDiscounts.push(newDiscount);
  return newDiscount;
};

/**
 * 更新系統折扣
 * TODO: 替換為 PUT /api/v1/admin/discounts/:discountId
 */
export const updateSystemDiscount = async (
  discountId: string,
  discountData: Partial<
    Omit<SystemDiscount, 'discount_id' | 'usage_count' | 'created_at' | 'created_by_type' | 'created_by_id'>
  >
): Promise<SystemDiscount> => {
  await delay(500);

  const index = mockSystemDiscounts.findIndex((d) => d.discount_id === discountId);
  if (index === -1) throw new Error('折扣不存在');

  mockSystemDiscounts[index] = {
    ...mockSystemDiscounts[index],
    ...discountData,
  };

  return mockSystemDiscounts[index];
};

/**
 * 刪除系統折扣
 * TODO: 替換為 DELETE /api/v1/admin/discounts/:discountId
 */
export const deleteSystemDiscount = async (
  discountId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  const index = mockSystemDiscounts.findIndex((d) => d.discount_id === discountId);
  if (index === -1) throw new Error('折扣不存在');

  mockSystemDiscounts.splice(index, 1);

  return {
    success: true,
    message: '折扣已刪除',
  };
};

/**
 * 切換系統折扣狀態
 * TODO: 替換為 PATCH /api/v1/admin/discounts/:discountId/toggle
 */
export const toggleDiscountStatus = async (
  discountId: string
): Promise<{ success: boolean; message: string; isActive: boolean }> => {
  await delay(300);

  const discount = mockSystemDiscounts.find((d) => d.discount_id === discountId);
  if (!discount) throw new Error('折扣不存在');

  discount.is_active = !discount.is_active;

  return {
    success: true,
    message: `折扣已${discount.is_active ? '啟用' : '停用'}`,
    isActive: discount.is_active,
  };
};

// ========== Mock Data ==========

// Dashboard 統計數據
const mockDashboardStats: DashboardStats = {
  totalRevenue: 5000000,
  totalUsers: 10000,
  activeSellers: 500,
  pendingReviews: 25,
  recentActivities: [
    {
      id: '1',
      type: 'seller_application',
      message: '新賣家申請',
      count: 3,
      timestamp: '2025-01-16 10:30',
    },
    {
      id: '2',
      type: 'product_review',
      message: '商品待審核',
      count: 15,
      timestamp: '2025-01-16 09:15',
    },
    {
      id: '3',
      type: 'dispute',
      message: '訂單爭議',
      count: 7,
      timestamp: '2025-01-15 18:45',
    },
  ],
  // 交易額趨勢數據（最近12個月）
  revenueChartData: [
    { label: '2024-02', value: 320000 },
    { label: '2024-03', value: 380000 },
    { label: '2024-04', value: 420000 },
    { label: '2024-05', value: 450000 },
    { label: '2024-06', value: 480000 },
    { label: '2024-07', value: 510000 },
    { label: '2024-08', value: 490000 },
    { label: '2024-09', value: 530000 },
    { label: '2024-10', value: 560000 },
    { label: '2024-11', value: 590000 },
    { label: '2024-12', value: 620000 },
    { label: '2025-01', value: 650000 },
  ],
  // 用戶增長數據（最近12個月）
  userGrowthChartData: [
    { label: '2024-02', value: 850 },
    { label: '2024-03', value: 920 },
    { label: '2024-04', value: 1050 },
    { label: '2024-05', value: 980 },
    { label: '2024-06', value: 1120 },
    { label: '2024-07', value: 1280 },
    { label: '2024-08', value: 1150 },
    { label: '2024-09', value: 1300 },
    { label: '2024-10', value: 1400 },
    { label: '2024-11', value: 1520 },
    { label: '2024-12', value: 1680 },
    { label: '2025-01', value: 1800 },
  ],
  // 訂單狀態分布數據
  orderStatusChartData: [
    { label: '已完成', value: 7200 },
    { label: '配送中', value: 1500 },
    { label: '處理中', value: 800 },
    { label: '已取消', value: 350 },
    { label: '退款中', value: 150 },
  ],
};

// 使用者數據
let mockUsers: User[] = [
  {
    user_id: '1',
    login_id: 'user001',
    name: '王小明',
    email: 'user001@example.com',
    phone_number: '0912345678',
    role: 'buyer',
    created_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  },
  {
    user_id: '2',
    login_id: 'seller001',
    name: '張大賣',
    email: 'seller001@example.com',
    phone_number: '0923456789',
    role: 'seller',
    created_at: '2024-02-01T00:00:00Z',
    deleted_at: null,
  },
];

// 賣家申請數據
let mockSellerApplications: SellerApplication[] = [
  {
    seller_id: '1',
    user_id: '3',
    user_name: '張大賣',
    email: 'seller001@example.com',
    phone: '0912345678',
    store_name: '大賣商店',
    store_description: '專營電子產品',
    store_address: '台北市信義區忠孝東路100號',
    store_email: 'store@example.com',
    store_phone: '02-1234-5678',
    bank_account_reference: '123-456-789',
    bank_account_name: '張大賣',
    bank_name: 'XX銀行',
    verified: false,
    verified_at: null,
    verified_by: null,
    created_at: '2025-01-15T10:30:00Z',
  },
];

// 訂單爭議數據
let mockDisputes: Dispute[] = [
  {
    dispute_id: '1',
    order_number: 'ORD20250101001',
    buyer_name: '王小明',
    seller_name: '張大賣',
    dispute_type: 'not_received',
    description: '商品未送達',
    buyer_evidence: '物流顯示已簽收但我沒收到',
    seller_response: null,
    status: 'pending',
    created_at: '2025-01-15T10:30:00Z',
    resolved_at: null,
    resolution: null,
  },
];

// 系統折扣數據
let mockSystemDiscounts: SystemDiscount[] = [
  {
    discount_id: '1',
    discount_code: 'NEWYEAR2025',
    discount_type: 'seasonal',
    name: '新年慶季節折扣',
    description: '新年期間全站商品享 10% 折扣',
    min_purchase_amount: 0,
    start_datetime: '2025-01-01T00:00:00Z',
    end_datetime: '2025-01-31T23:59:59Z',
    is_active: true,
    usage_limit: null,
    usage_count: 45,
    created_by_type: 'system',
    created_by_id: null,
    created_at: '2024-12-20T00:00:00Z',
    discount_rate: 10,
    max_discount_amount: 500,
  },
  {
    discount_id: '2',
    discount_code: 'FREESHIP30',
    discount_type: 'shipping',
    name: '春節運費優惠',
    description: '滿額免運費優惠',
    min_purchase_amount: 500,
    start_datetime: '2025-01-20T00:00:00Z',
    end_datetime: '2025-02-10T23:59:59Z',
    is_active: true,
    usage_limit: 1000,
    usage_count: 234,
    created_by_type: 'system',
    created_by_id: null,
    created_at: '2025-01-10T00:00:00Z',
    discount_amount: 30,
  },
];

// 默認導出
export default {
  getDashboardStats,
  getUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
  getDisputes,
  resolveDispute,
  getSystemDiscounts,
  createSystemDiscount,
  updateSystemDiscount,
  deleteSystemDiscount,
  toggleDiscountStatus,
};
