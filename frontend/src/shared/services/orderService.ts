/*
 - Order Service - Mock API
 - 訂單服務
 */

import type { CreateOrderRequest, CreateMultipleOrdersResponse } from "@/types/order";

// 模擬網絡延遲
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Service 函數
// ============================================

/*
 - 建立訂單（多商店版本）
 - TODO: 替換為 POST /api/v1/orders
 -
 - 後端預期行為：
 - 1. 驗證地址屬於當前用戶
 - 2. 從購物車獲取商品並按 storeId 分組
 - 3. 為每個商店建立獨立訂單
 - 4. 驗證商品庫存
 - 5. 計算各訂單金額
 - 6. 扣減庫存（或標記為 reserved）
 - 7. 返回所有訂單資訊
 -
 - 注意：後端目前僅返回第一個訂單（需要修改）
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateMultipleOrdersResponse> => {
  console.log("[Mock API] Create order:", orderData);
  await delay(800);

  // TODO: 替換為真實 API 調用
  // POST /api/v1/orders
  // Body: { addressId, paymentMethod, note }
  // 後端會自動從購物車獲取商品並按商店分組創建多個訂單

  // Mock: 模擬返回多個訂單（實際應該由後端決定）
  // 這裡假設購物車有 2 個商店的商品
  const timestamp = Date.now();
  const mockOrders = [
    {
      orderId: `ORD${timestamp}-1`,
      storeId: 'store-1',
      storeName: '測試商店 A',
      totalAmount: 580,
    },
    {
      orderId: `ORD${timestamp}-2`,
      storeId: 'store-2',
      storeName: '測試商店 B',
      totalAmount: 720,
    },
  ];

  return {
    success: true,
    message: `成功建立 ${mockOrders.length} 筆訂單`,
    orders: mockOrders,
    totalAmount: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
  };
};
