import { get, post, patch, del } from './api';
import type {
  DashboardStats,
  AdminUser,
  AdminStore,
  SellerApplication,
  SystemDiscount,
  AdminOrder,
  AdminOrderFilters,
} from "@/types/admin";

/**
 * 管理員服務層
 * 提供所有管理員相關的 API 調用
 */

// ========== Mapper Functions ==========

/**
 * 將後端 Seller 資料轉換為前端 SellerApplication 格式
 */
const mapBackendSellerToApplication = (seller: any): SellerApplication => ({
  seller_id: seller.sellerId,
  user_id: seller.userId,

  // User info from joined relation
  login_id: seller.user?.loginId || '',
  user_name: seller.user?.name || '',
  email: seller.user?.email || '',
  phone_number: seller.user?.phoneNumber || '',

  // Seller info
  bank_account_reference: seller.bankAccountReference || '',
  verified: seller.verified,
  verified_at: seller.verifiedAt,
  verified_by: seller.verifiedBy,
  rejected_at: seller.rejectedAt,

  // Timestamps
  created_at: seller.createdAt,
  updated_at: seller.updatedAt,
});

/**
 * 將後端 User 資料轉換為前端 AdminUser 格式
 */
const mapBackendUserToAdminUser = (user: any): AdminUser => ({
  user_id: user.userId,
  login_id: user.loginId,
  name: user.name,
  email: user.email,
  phone_number: user.phoneNumber || '',
  role: user.role,
  created_at: user.createdAt,
  deleted_at: user.deletedAt,
});

/**
 * 將後端 Store 資料轉換為前端 AdminStore 格式
 */
const mapBackendStoreToAdminStore = (store: any): AdminStore => ({
  store_id: store.storeId,
  store_name: store.storeName,
  seller_id: store.sellerId,
  seller_name: store.seller?.name || '',
  seller_email: store.seller?.email || '',
  description: store.storeDescription || '',
  address: store.storeAddress || '',
  email: store.storeEmail || '',
  phone: store.storePhone || '',
  rating: typeof store.averageRating === 'string' ? parseFloat(store.averageRating) : (store.averageRating || 0),
  total_ratings: store.totalRatings || 0,
  product_count: store.productCount || 0,
  created_at: store.createdAt,
  deleted_at: store.deletedAt,
});

/**
 * 將後端 Discount 資料轉換為前端 SystemDiscount 格式
 */
const mapBackendDiscountToSystemDiscount = (discount: any): SystemDiscount => ({
  discount_id: discount.discountId,
  discount_code: discount.discountCode,
  discount_type: discount.discountType,
  name: discount.name,
  description: discount.description || '',
  min_purchase_amount: discount.minPurchaseAmount,
  start_datetime: discount.startDatetime,
  end_datetime: discount.endDatetime,
  is_active: discount.isActive,
  usage_limit: discount.usageLimit,
  usage_count: discount.usageCount,
  created_by_type: discount.createdByType,
  created_by_id: discount.createdById,
  created_at: discount.createdAt,
  // Type-specific fields
  discount_rate: discount.seasonalDiscount?.discountRate,
  max_discount_amount: discount.seasonalDiscount?.maxDiscountAmount,
  discount_amount: discount.shippingDiscount?.discountAmount,
});

/**
 * 將前端 SystemDiscount 資料轉換為後端格式
 */
const mapSystemDiscountToBackend = (data: Partial<SystemDiscount>): any => {
  const baseData: any = {
    discountType: data.discount_type,
    name: data.name,
    description: data.description,
    minPurchaseAmount: data.min_purchase_amount,
    startDatetime: data.start_datetime,
    endDatetime: data.end_datetime,
    isActive: data.is_active,
    usageLimit: data.usage_limit,
  };

  // Add type-specific details
  if (data.discount_type === 'seasonal' && data.discount_rate !== undefined) {
    baseData.seasonalDetails = {
      discountRate: data.discount_rate,
      maxDiscountAmount: data.max_discount_amount,
    };
  }

  if (data.discount_type === 'shipping' && data.discount_amount !== undefined) {
    baseData.shippingDetails = {
      discountAmount: data.discount_amount,
    };
  }

  return baseData;
};

// ========== Dashboard ==========

/**
 * 獲取 Dashboard 統計數據
 * GET /admin/dashboard/stats?startDate=&endDate=
 */
export const getDashboardStats = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<DashboardStats> => {
  const queryParams = new URLSearchParams();

  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/admin/dashboard/stats?${queryString}` : '/admin/dashboard/stats';

  const result = await get<DashboardStats>(url);
  return result;
};

// ========== Users Management ==========

/**
 * 獲取使用者列表
 * GET /users?search=&role=
 */
export const getUsers = async (params?: {
  search?: string;
  role?: "buyer" | "seller" | "all";
  includeSuspended?: boolean;
}): Promise<{ users: AdminUser[]; total: number }> => {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }

  if (params?.role && params.role !== "all") {
    queryParams.append('role', params.role);
  }

  // Include suspended users
  if (params?.includeSuspended) {
    queryParams.append('includeSuspended', 'true');
  }

  const result = await get<{ data: any[]; total: number }>(`/users?${queryParams.toString()}`);

  return {
    users: result.data.map(mapBackendUserToAdminUser),
    total: result.total,
  };
};

/**
 * 停權使用者（軟刪除）
 * POST /users/:userId/suspend
 */
export const suspendUser = async (
  userId: string,
  _reason: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/users/${userId}/suspend`, {});

  return {
    success: true,
    message: "使用者已停權",
  };
};

/**
 * 解除停權
 * POST /users/:userId/restore-suspended
 */
export const unsuspendUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/users/${userId}/restore-suspended`, {});

  return {
    success: true,
    message: "已解除停權",
  };
};

/**
 * 刪除使用者（永久刪除）
 * DELETE /users/:userId/permanent
 */
export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  await del(`/users/${userId}/permanent`);

  return {
    success: true,
    message: "使用者已刪除",
  };
};

// ========== Stores Management ==========

/**
 * 獲取商家列表
 * GET /stores?search=&includeSuspended=
 */
export const getStores = async (params?: {
  search?: string;
  includeSuspended?: boolean;
}): Promise<{ stores: AdminStore[]; total: number }> => {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }

  // Include suspended stores
  if (params?.includeSuspended) {
    queryParams.append('includeSuspended', 'true');
  }

  const result = await get<{ data: any[]; total: number }>(`/stores?${queryParams.toString()}`);

  return {
    stores: result.data.map(mapBackendStoreToAdminStore),
    total: result.total,
  };
};

/**
 * 停權商家（軟刪除）
 * DELETE /stores/:storeId
 */
export const suspendStore = async (
  storeId: string,
  _reason: string
): Promise<{ success: boolean; message: string }> => {
  await del(`/stores/${storeId}`);

  return {
    success: true,
    message: "商家已停權",
  };
};

/**
 * 解除商家停權
 * POST /stores/:storeId/restore
 */
export const unsuspendStore = async (
  storeId: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/stores/${storeId}/restore`);

  return {
    success: true,
    message: "已解除停權",
  };
};

// ========== Seller Applications ==========

/**
 * 獲取賣家申請列表
 * GET /sellers?status=pending|approved|rejected
 */
export const getSellerApplications = async (params?: {
  status?: "pending" | "approved" | "rejected" | "all";
}): Promise<SellerApplication[]> => {
  const queryParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    queryParams.append('status', params.status);
  }

  const result = await get<{ data: any[] }>(`/sellers?${queryParams.toString()}`);
  return result.data.map(mapBackendSellerToApplication);
};

/**
 * 批准賣家申請
 * POST /sellers/:sellerId/verify
 */
export const approveSellerApplication = async (
  sellerId: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/sellers/${sellerId}/verify`);

  return {
    success: true,
    message: "賣家申請已批准",
  };
};

/**
 * 拒絕賣家申請
 * POST /sellers/:sellerId/reject
 */
export const rejectSellerApplication = async (
  sellerId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/sellers/${sellerId}/reject`, reason ? { reason } : undefined);

  return {
    success: true,
    message: "已拒絕賣家申請",
  };
};

// ========== Order Management ==========

/**
 * Map backend order data to frontend AdminOrder type
 */
const mapBackendOrderToAdminOrder = (order: any): AdminOrder => ({
  order_id: order.orderId,
  order_number: order.orderNumber,
  buyer_id: order.buyerId,
  buyer_name: order.buyerName,
  buyer_email: order.buyerEmail,
  seller_id: order.sellerId,
  seller_name: order.sellerName,
  store_name: order.storeName,
  status: order.status,
  payment_method: order.paymentMethod,
  items: order.items,
  shipping_address: order.shippingAddress,
  note: order.note,
  subtotal: order.subtotal,
  shipping: order.shipping,
  discount: order.discount,
  total_amount: order.totalAmount,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
  paid_at: order.paidAt,
  shipped_at: order.shippedAt,
  delivered_at: order.deliveredAt,
  completed_at: order.completedAt,
  cancelled_at: order.cancelledAt,
});

/**
 * 獲取訂單列表（管理員）
 * GET /orders/admin/all
 */
export const getAdminOrders = async (
  filters?: AdminOrderFilters
): Promise<{ orders: AdminOrder[]; total: number }> => {
  const queryParams = new URLSearchParams();

  if (filters?.search) {
    queryParams.append('search', filters.search);
  }
  if (filters?.status && filters.status !== 'all') {
    queryParams.append('status', filters.status);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters?.page) {
    queryParams.append('page', filters.page.toString());
  }
  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  const result = await get<{ data: any[]; total: number }>(
    `/orders/admin/all?${queryParams.toString()}`
  );

  return {
    orders: result.data.map(mapBackendOrderToAdminOrder),
    total: result.total,
  };
};

/**
 * 獲取單個訂單詳情（管理員）
 * GET /orders/admin/:id
 */
export const getAdminOrderById = async (
  orderId: string
): Promise<AdminOrder> => {
  const order = await get<any>(`/orders/admin/${orderId}`);
  return mapBackendOrderToAdminOrder(order);
};

/**
 * 標記訂單異常（已改為直接取消訂單）
 * POST /orders/admin/:id/cancel
 * @deprecated 原本的標記功能已改為直接取消訂單，adminNotes 參數現在作為取消原因
 */
export const flagOrder = async (
  orderId: string,
  adminNotes: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/orders/admin/${orderId}/cancel`, {
    reason: adminNotes,
  });

  return {
    success: true,
    message: "訂單已取消",
  };
};

/**
 * 取消標記訂單異常
 * @deprecated 此功能已棄用。因為訂單取消操作不可逆，所以不再提供取消標記功能。
 * 如果管理員發現異常，應直接使用 flagOrder (現在會取消訂單)。
 */
export const unflagOrder = async (
  _orderId: string
): Promise<{ success: boolean; message: string }> => {
  console.warn('unflagOrder is deprecated: 訂單取消操作不可逆，此功能已停用');
  throw new Error("此功能已棄用：訂單取消操作不可逆，無法恢復");
};

/**
 * Admin 更新訂單狀態（無狀態轉換限制）
 * PATCH /orders/admin/:orderId/status
 */
export const updateAdminOrderStatus = async (
  orderId: string,
  status: string
): Promise<{ success: boolean; message: string }> => {
  await patch(`/orders/admin/${orderId}/status`, { status });

  return {
    success: true,
    message: "訂單狀態已更新",
  };
};

/**
 * Admin 取消訂單（附原因）
 * POST /orders/admin/:orderId/cancel
 */
export const cancelAdminOrder = async (
  orderId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  await post(`/orders/admin/${orderId}/cancel`, { reason });

  return {
    success: true,
    message: "訂單已取消",
  };
};

/**
 * 獲取異常訂單列表（pending_payment 超過 24 小時）
 * GET /orders/admin/anomalies
 */
export const getAnomalyOrders = async (): Promise<AdminOrder[]> => {
  const result = await get<any[]>('/orders/admin/anomalies');

  // Map backend format to AdminOrder format
  return result.map((order) => ({
    order_id: order.orderId,
    order_number: order.orderNumber,
    buyer_id: order.userId?.toString() || '',
    buyer_name: order.buyerName || '',
    buyer_email: order.buyerEmail || '',
    seller_id: order.storeId?.toString() || '',
    seller_name: order.sellerName || '',
    store_name: order.storeName || '',
    status: order.orderStatus,
    payment_method: order.paymentMethod || '',
    items: [],
    shipping_address: {
      id: '',
      recipientName: '',
      phone: '',
      city: '',
      district: '',
      postalCode: '',
      addressLine1: '',
      isDefault: false,
    },
    subtotal: order.subtotal || 0,
    shipping: order.shippingFee || 0,
    discount: order.totalDiscount || 0,
    total_amount: order.totalAmount,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    paid_at: order.paidAt,
    shipped_at: order.shippedAt,
    delivered_at: order.deliveredAt,
    completed_at: order.completedAt,
    cancelled_at: order.cancelledAt
  }));
};

// ========== System Discounts ==========

/**
 * 獲取系統折扣列表
 * GET /discounts?discountType=seasonal|shipping
 */
export const getSystemDiscounts = async (params?: {
  type?: "seasonal" | "shipping";
}): Promise<SystemDiscount[]> => {
  const queryParams = new URLSearchParams();

  if (params?.type) {
    queryParams.append('discountType', params.type);
  }

  const result = await get<{ data: any[] }>(`/discounts?${queryParams.toString()}`);

  // Filter system discounts only
  return result.data
    .filter(d => d.createdByType === 'system')
    .map(mapBackendDiscountToSystemDiscount);
};

/**
 * 創建系統折扣
 * POST /discounts/admin
 */
export const createSystemDiscount = async (
  discountData: Omit<
    SystemDiscount,
    | "discount_id"
    | "usage_count"
    | "created_at"
    | "created_by_type"
    | "created_by_id"
  >
): Promise<SystemDiscount> => {
  const backendData = mapSystemDiscountToBackend(discountData);
  const result = await post<any>('/discounts/admin', backendData);
  return mapBackendDiscountToSystemDiscount(result);
};

/**
 * 更新系統折扣
 * PATCH /discounts/admin/:discountId
 */
export const updateSystemDiscount = async (
  discountId: string,
  discountData: Partial<
    Omit<
      SystemDiscount,
      | "discount_id"
      | "usage_count"
      | "created_at"
      | "created_by_type"
      | "created_by_id"
    >
  >
): Promise<SystemDiscount> => {
  const backendData = mapSystemDiscountToBackend(discountData);

  // 移除不可更新的欄位（後端 UpdateDiscountDto 不允許更新這些欄位）
  delete backendData.discountCode;
  delete backendData.discountType;

  const result = await patch<any>(`/discounts/admin/${discountId}`, backendData);
  return mapBackendDiscountToSystemDiscount(result);
};

/**
 * 更新系統折扣狀態
 * PATCH /discounts/admin/:discountId
 */
export const updateSystemDiscountStatus = async (
  discountId: string,
  isActive: boolean
): Promise<{ success: boolean; message: string }> => {
  await patch(`/discounts/admin/${discountId}`, { isActive });

  return {
    success: true,
    message: `折扣已${isActive ? "啟用" : "停用"}`,
  };
};

/**
 * 刪除系統折扣
 * DELETE /discounts/:discountId
 */
export const deleteSystemDiscount = async (
  discountId: string
): Promise<{ success: boolean; message: string }> => {
  await del(`/discounts/${discountId}`);

  return {
    success: true,
    message: "折扣已刪除",
  };
};

/**
 * 切換系統折扣狀態
 * GET + PATCH /discounts/code/:discountId + /discounts/admin/:discountId
 */
export const toggleDiscountStatus = async (
  discountId: string
): Promise<{ success: boolean; message: string; isActive: boolean }> => {
  // First get current status
  const currentDiscount = await get<any>(`/discounts/code/${discountId}`);
  const newStatus = !currentDiscount.isActive;

  // Update status
  await patch(`/discounts/admin/${discountId}`, { isActive: newStatus });

  return {
    success: true,
    message: `折扣已${newStatus ? "啟用" : "停用"}`,
    isActive: newStatus,
  };
};

// 默認導出
export default {
  getDashboardStats,
  getUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getStores,
  suspendStore,
  unsuspendStore,
  getSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
  getAdminOrders,
  getAdminOrderById,
  flagOrder,
  unflagOrder,
  updateAdminOrderStatus,
  cancelAdminOrder,
  getAnomalyOrders,
  toggleDiscountStatus,
  getSystemDiscounts,
  createSystemDiscount,
  updateSystemDiscount,
  updateSystemDiscountStatus,
  deleteSystemDiscount,
};
