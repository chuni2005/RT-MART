import type {
  DashboardStats,
  AdminUser,
  AdminStore,
  SellerApplication,
  SystemDiscount,
  AdminOrder,
  AdminOrderFilters,
} from "@/types/admin";
import { mockDashboardStats, mockAdminOrders, delay } from './adminService.mock';

/**
 * Mock implementation of adminService for testing
 * Set VITE_USE_MOCK_ADMIN=true in .env to use this
 */

// ========== Dashboard ==========

export const getDashboardStats = async (): Promise<DashboardStats> => {
  await delay(500);
  return { ...mockDashboardStats };
};

// ========== Users Management ==========

export const getUsers = async (params?: {
  search?: string;
  role?: "buyer" | "seller" | "all";
}): Promise<{ users: AdminUser[]; total: number }> => {
  await delay(400);
  console.log('[MOCK] getUsers called with params:', params);
  // Return empty for now, can add mock users if needed
  return { users: [], total: 0 };
};

export const suspendUser = async (
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] suspendUser:', userId, reason);
  return {
    success: true,
    message: "使用者已停權",
  };
};

export const unsuspendUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] unsuspendUser:', userId);
  return {
    success: true,
    message: "已解除停權",
  };
};

export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] deleteUser:', userId);
  return {
    success: true,
    message: "使用者已刪除",
  };
};

// ========== Stores Management ==========

export const getStores = async (params?: {
  search?: string;
}): Promise<{ stores: AdminStore[]; total: number }> => {
  await delay(400);
  console.log('[MOCK] getStores called with params:', params);
  return { stores: [], total: 0 };
};

export const suspendStore = async (
  storeId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] suspendStore:', storeId, reason);
  return {
    success: true,
    message: "商家已停權",
  };
};

export const unsuspendStore = async (
  storeId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] unsuspendStore:', storeId);
  return {
    success: true,
    message: "已解除停權",
  };
};

// ========== Seller Applications ==========

export const getSellerApplications = async (params?: {
  status?: "pending" | "approved" | "rejected" | "all";
}): Promise<SellerApplication[]> => {
  await delay(400);
  console.log('[MOCK] getSellerApplications called with params:', params);
  return [];
};

export const approveSellerApplication = async (
  sellerId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] approveSellerApplication:', sellerId);
  return {
    success: true,
    message: "賣家申請已批准",
  };
};

export const rejectSellerApplication = async (
  sellerId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] rejectSellerApplication:', sellerId, reason);
  return {
    success: true,
    message: "已拒絕賣家申請",
  };
};

// ========== Order Management ==========

export const getAdminOrders = async (
  filters?: AdminOrderFilters
): Promise<{ orders: AdminOrder[]; total: number }> => {
  await delay(400);
  console.log('[MOCK] getAdminOrders called with filters:', filters);

  let filtered = [...mockAdminOrders];

  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.order_number.toLowerCase().includes(search) ||
        order.buyer_name.toLowerCase().includes(search) ||
        order.seller_name.toLowerCase().includes(search) ||
        order.store_name.toLowerCase().includes(search)
    );
  }

  if (filters?.status && filters.status !== "all") {
    filtered = filtered.filter((order) => order.status === filters.status);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(
      (order) => new Date(order.created_at) >= new Date(filters.startDate!)
    );
  }

  if (filters?.endDate) {
    filtered = filtered.filter(
      (order) => new Date(order.created_at) <= new Date(filters.endDate!)
    );
  }

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedOrders = filtered.slice(start, end);

  return {
    orders: paginatedOrders,
    total: filtered.length,
  };
};

export const getAdminOrderById = async (
  orderId: string
): Promise<AdminOrder> => {
  await delay(300);
  console.log('[MOCK] getAdminOrderById:', orderId);

  const order = mockAdminOrders.find((o) => o.order_id === orderId);
  if (!order) throw new Error("訂單不存在");

  return { ...order };
};

export const flagOrder = async (
  orderId: string,
  adminNotes: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] flagOrder (cancel):', orderId, adminNotes);

  return {
    success: true,
    message: "訂單已取消",
  };
};

export const unflagOrder = async (
  _orderId: string
): Promise<{ success: boolean; message: string }> => {
  console.warn('[MOCK] unflagOrder is deprecated');
  throw new Error("此功能已棄用：訂單取消操作不可逆，無法恢復");
};

export const updateAdminOrderStatus = async (
  orderId: string,
  status: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] updateAdminOrderStatus:', orderId, status);
  return {
    success: true,
    message: "訂單狀態已更新",
  };
};

export const cancelAdminOrder = async (
  orderId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] cancelAdminOrder:', orderId, reason);
  return {
    success: true,
    message: "訂單已取消",
  };
};

export const getAnomalyOrders = async (): Promise<AdminOrder[]> => {
  await delay(400);
  console.log('[MOCK] getAnomalyOrders');
  // Mock: return orders with status that might be anomalies
  return mockAdminOrders.filter(order =>
    order.status === 'cancelled' || order.status === 'pending_payment'
  );
};

// ========== System Discounts ==========

export const getSystemDiscounts = async (params?: {
  type?: "seasonal" | "shipping";
}): Promise<SystemDiscount[]> => {
  await delay(400);
  console.log('[MOCK] getSystemDiscounts called with params:', params);
  return [];
};

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
  await delay(500);
  console.log('[MOCK] createSystemDiscount:', discountData);
  return {
    ...discountData,
    discount_id: "mock-" + Date.now(),
    usage_count: 0,
    created_at: new Date().toISOString(),
    created_by_type: "system",
    created_by_id: null,
  };
};

export const updateSystemDiscount = async (
  discountId: string,
  discountData: Partial<Omit<SystemDiscount, "discount_id" | "usage_count" | "created_at" | "created_by_type" | "created_by_id">>
): Promise<SystemDiscount> => {
  await delay(300);
  console.log('[MOCK] updateSystemDiscount:', discountId, discountData);
  return {
    discount_id: discountId,
    discount_code: discountData.discount_code || "MOCK",
    discount_type: discountData.discount_type || "seasonal",
    name: discountData.name || "Mock Discount",
    description: discountData.description || "",
    min_purchase_amount: discountData.min_purchase_amount || 0,
    start_datetime: discountData.start_datetime || new Date().toISOString(),
    end_datetime: discountData.end_datetime || new Date().toISOString(),
    is_active: discountData.is_active ?? true,
    usage_limit: discountData.usage_limit || null,
    usage_count: 0,
    created_by_type: "system",
    created_by_id: null,
    created_at: new Date().toISOString(),
  };
};

export const updateSystemDiscountStatus = async (
  discountId: string,
  isActive: boolean
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] updateSystemDiscountStatus:', discountId, isActive);
  return {
    success: true,
    message: `折扣已${isActive ? "啟用" : "停用"}`,
  };
};

export const deleteSystemDiscount = async (
  discountId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);
  console.log('[MOCK] deleteSystemDiscount:', discountId);
  return {
    success: true,
    message: "折扣已刪除",
  };
};

export const toggleDiscountStatus = async (
  discountId: string
): Promise<{ success: boolean; message: string; isActive: boolean }> => {
  await delay(300);
  const newStatus = Math.random() > 0.5; // Random for demo
  console.log('[MOCK] toggleDiscountStatus:', discountId, newStatus);
  return {
    success: true,
    message: `折扣已${newStatus ? "啟用" : "停用"}`,
    isActive: newStatus,
  };
};

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
