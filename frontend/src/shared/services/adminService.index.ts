const useMockAPI = import.meta.env.VITE_USE_MOCK_API === 'true';

if (useMockAPI) {
  console.log('[Admin Service] Using MOCK implementation');
}

// Dynamic import based on environment
const service = useMockAPI
  ? await import('./adminService.mock.impl')
  : await import('./adminService');

export const {
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
} = service.default || service;

export default service.default || service;
