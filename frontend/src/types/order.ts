// Order related types

import type { CartItem } from './common';

export type PaymentMethod = 'credit_card' | 'cash_on_delivery';

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
    storeId: string;
    storeName: string;
    totalAmount: number;
  }>;
  totalAmount: number;  // 所有訂單總額
}
