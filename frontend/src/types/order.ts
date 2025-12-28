// Order related types

import type { CartItem, Address } from './common';

export type PaymentMethod = 'credit_card' | 'cash_on_delivery' | 'debit_card' | 'bank_transfer';

// Order Status (訂單狀態)
export type OrderStatus =
  | 'pending_payment'   // 待付款
  | 'payment_failed'    // 付款失敗
  | 'paid'              // 已付款
  | 'processing'        // 處理中
  | 'shipped'           // 已出貨
  | 'delivered'         // 已送達
  | 'completed'         // 已完成
  | 'cancelled';        // 已取消

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

/**
 * 商店訂單組（用於結帳頁面展示）
 * 代表每個商店將要建立的訂單
 */
export interface StoreOrderGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
  subtotal: number;        // 此商店商品總額
  shipping: number;        // 此商店實際運費
  shippingDiscount: number; // 此商店運費折抵
  total: number;           // 此商店小計
}

/**
 * 簡化版訂單建立請求
 * 後端會自動從購物車獲取商品並計算金額
 */
export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  note?: string;  // 合併後的備註
}

/**
 * 多訂單建立響應
 * 後端會為每個商店建立獨立訂單
 */
export interface CreateMultipleOrdersResponse {
  success: boolean;
  message: string;
  orders: Array<{
    orderId: string;
    orderNumber?: string;
    storeId: string;
    storeName: string;
    totalAmount: number;
  }>;
  totalAmount: number;  // 所有訂單總額
}

// ============================================
// User Center 相關類型 (訂單列表、訂單詳情)
// ============================================

// Order Item Detail (訂單項目詳情 - 包含商品資訊)
export interface OrderItemDetail extends OrderItem {
  id: string;
  productName: string;
  productImage?: string;
}

// Complete Order (完整訂單資訊 - 用於訂單詳情頁)
export interface Order {
  orderId: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  storeName: string;
  status: OrderStatus;
  items: OrderItemDetail[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  note?: string;
  subtotal: number;
  shipping: number;
  discount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// Order List Item (訂單列表項目 - 簡化版)
// List endpoint returns basic info only, use detail endpoint for items
export interface OrderListItem {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  items?: OrderItemDetail[]; // Optional - not included in list for performance
  totalAmount: number;
  createdAt: string;
}

// Get Orders Params (獲取訂單列表參數)
export interface GetOrdersParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

// Get Orders Response (獲取訂單列表回應)
export interface GetOrdersResponse {
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}