/*
 - Order Service - Mock API
 - 訂單服務
 */

import type { CreateOrderRequest, CreateOrderResponse } from "@/types/order";

// 模擬網絡延遲
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Service 函數
// ============================================

/*
 - 建立訂單
 - TODO: 替換為 POST /api/v1/orders
 -
 - 後端預期行為：
 - 1. 驗證地址屬於當前用戶
 - 2. 驗證商品庫存
 - 3. 計算訂單金額
 - 4. 創建訂單記錄
 - 5. 扣減庫存（或標記為 reserved）
 - 6. 返回訂單號
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  console.log("[Mock API] Create order:", orderData);
  await delay(800);

  // 模擬訂單創建
  const orderId = `ORD${Date.now()}`;

  return {
    success: true,
    message: "訂單建立成功",
    orderId,
    totalAmount: orderData.totalAmount,
  };
};
