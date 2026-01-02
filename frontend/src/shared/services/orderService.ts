/*
 - Order Service - API Integration
 - 訂單服務
 */

import type {
  CreateOrderRequest,
  CreateMultipleOrdersResponse,
  Order,
  GetOrdersParams,
  GetOrdersResponse,
  OrderItemDetail,
} from "@/types/order";
import type { ApiResponse } from "@/types/user";
import { get, post, patch } from "./api";

// ============================================
// 設定與環境變數
// ============================================

const USE_MOCK_API = (import.meta as any).env.VITE_USE_MOCK_API === 'true';

console.log(`[OrderService] Current Mode: ${USE_MOCK_API ? 'MOCK' : 'REAL API'}`);

// ============================================
// 介面定義 (Backend API Response Types)
// ============================================

/**
 * 後端 Order Entity 結構 (對應 backend/src/orders/entities/order.entity.ts)
 */
interface BackendOrder {
  orderId: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  orderStatus: string;
  subtotal: string | number;
  shippingFee: string | number;
  totalDiscount: string | number;
  totalAmount: string | number;
  paymentMethod: string | null;
  shippingAddressSnapshot: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  store?: {
    storeName: string;
  };
  items?: BackendOrderItem[];
}

/**
 * 後端 OrderItem Entity 結構 (對應 backend/src/orders/entities/order-item.entity.ts)
 */
interface BackendOrderItem {
  orderItemId: string;
  productId: string | null;
  productSnapshot: {
    productId: string;
    productName: string;
    price: string | number;
    images: Array<{ imageUrl: string }>;
  };
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
}

/**
 * 後端列表 API 回應結構
 */
interface BackendOrderListResponse {
  data: BackendOrder[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// 輔助函數 (Data Transformation)
// ============================================

/**
 * 將後端 OrderItem 轉換為前端 OrderItemDetail
 */
const transformOrderItem = (item: BackendOrderItem): OrderItemDetail => ({
  id: item.orderItemId,
  productId: item.productId || item.productSnapshot.productId,
  productName: item.productSnapshot.productName,
  productImage: item.productSnapshot.images?.[0]?.imageUrl || '',
  quantity: item.quantity,
  price: Number(item.unitPrice),
});

/**
 * 將後端 Order 轉換為前端 Order
 */
const transformOrder = (be: BackendOrder): Order => ({
  orderId: be.orderId,
  orderNumber: be.orderNumber,
  userId: be.userId,
  storeId: be.storeId,
  storeName: be.store?.storeName || '未知商店',
  status: be.orderStatus as any,
  items: be.items?.map(transformOrderItem) || [],
  shippingAddress: be.shippingAddressSnapshot,
  paymentMethod: be.paymentMethod as any,
  note: be.notes || '',
  subtotal: Number(be.subtotal),
  shipping: Number(be.shippingFee),
  discount: Number(be.totalDiscount),
  totalAmount: Number(be.totalAmount),
  createdAt: be.createdAt,
  updatedAt: be.updatedAt,
  paidAt: be.paidAt || undefined,
  shippedAt: be.shippedAt || undefined,
  deliveredAt: be.deliveredAt || undefined,
  completedAt: be.completedAt || undefined,
  cancelledAt: be.cancelledAt || undefined,
});

// 模擬網絡延遲
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Service 函數
// ============================================

/**
 * 建立訂單
 * POST /orders
 */
export const createOrderApi = async (
  orderData: CreateOrderRequest
): Promise<CreateMultipleOrdersResponse> => {
  try {
    // 構建請求 payload
    const payload: any = {
      shippingAddressId: orderData.addressId,
      paymentMethod: orderData.paymentMethod,
      notes: orderData.note,
    };

    // 添加折扣碼（如果存在）
    if (orderData.discountCodes?.shipping) {
      payload.shippingDiscountCode = orderData.discountCodes.shipping;
    }
    if (orderData.discountCodes?.product) {
      payload.productDiscountCode = orderData.discountCodes.product;
    }

    const response = await post<BackendOrder[]>('/orders', payload);

    // 計算總金額（所有拆分訂單的加總）
    const totalAmount = response.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    return {
      success: true,
      message: '成功建立訂單',
      orders: response.map((order) => ({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        storeName: order.store?.storeName || '商店',
        totalAmount: Number(order.totalAmount),
      })),
      totalAmount: totalAmount,
    };
  } catch (error) {
    console.error('[API Error] createOrderApi:', error);
    throw error;
  }
};

/**
 * 建立訂單（模擬版本）
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateMultipleOrdersResponse> => {
  // 如果不是 Mock 模式，呼叫真實 API
  if (!USE_MOCK_API) {
    return createOrderApi(orderData);
  }

  console.log("[Mock API] Create order:", orderData);
  await delay(800);

  const timestamp = Date.now();
  const mockOrders = [
    {
      orderId: `ORD${timestamp}-1`,
      storeId: "store-1",
      storeName: "測試商店 A",
      totalAmount: 580,
    },
    {
      orderId: `ORD${timestamp}-2`,
      storeId: "store-2",
      storeName: "測試商店 B",
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

// ============================================
// User Center 相關服務函數
// ============================================

/**
 * Mock 訂單資料庫
 */
const mockOrdersData: Order[] = [
  {
    orderId: "order-001",
    orderNumber: "ORD20251212001",
    userId: "user_001",
    storeId: "store_001",
    storeName: "Apple 官方旗艦店",
    status: "pending_payment",
    items: [
      {
        id: "item-001",
        productId: "prod-001",
        productName: "iPhone 15 Pro Max 256GB",
        productImage: "https://picsum.photos/seed/iphone15/200",
        quantity: 1,
        price: 42900,
      },
    ],
    shippingAddress: {
      id: "addr_001",
      recipientName: "王小明",
      phone: "0912345678",
      city: "台北市",
      district: "大安區",
      postalCode: "106",
      addressLine1: "忠孝東路三段 100 號",
      isDefault: true,
    },
    paymentMethod: "credit_card",
    note: "請在上午送達",
    subtotal: 57880,
    shipping: 0,
    discount: 0,
    totalAmount: 57880,
    createdAt: "2025-12-12T10:30:00Z",
    updatedAt: "2025-12-12T10:30:00Z",
  },
];

/**
 * 獲取訂單列表
 */
export const getOrders = async (params?: GetOrdersParams): Promise<GetOrdersResponse> => {
  if (!USE_MOCK_API) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await get<BackendOrderListResponse>(`/orders?${queryParams.toString()}`);
      
      return {
        orders: response.data.map(order => ({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          status: order.orderStatus as any,
          // items not included in list for performance - use getOrderDetail for full data
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
        })),
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: Math.ceil(response.total / response.limit),
      };
    } catch (error) {
      console.error('[API Error] getOrders:', error);
      throw error;
    }
  }

  console.log('[Mock API] Get orders:', params);
  await delay(400);

  let filteredOrders = [...mockOrdersData];
  if (params?.status) {
    filteredOrders = mockOrdersData.filter((o) => o.status === params.status);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedOrders = filteredOrders.slice(start, end);

  return {
    orders: paginatedOrders.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    })),
    total: filteredOrders.length,
    page,
    limit,
    totalPages: Math.ceil(filteredOrders.length / limit),
  };
};

/**
 * 獲取訂單詳情
 */
export const getOrderDetail = async (orderId: string): Promise<Order> => {
  if (!USE_MOCK_API) {
    try {
      const response = await get<BackendOrder>(`/orders/${orderId}`);
      return transformOrder(response);
    } catch (error) {
      console.error('[API Error] getOrderDetail:', error);
      throw error;
    }
  }

  console.log('[Mock API] Get order detail:', orderId);
  await delay(400);

  const order = mockOrdersData.find((o) => o.orderId === orderId);
  if (!order) throw new Error('訂單不存在');
  return order;
};

/**
 * 取消訂單
 */
export const cancelOrder = async (orderId: string): Promise<ApiResponse> => {
  if (!USE_MOCK_API) {
    try {
      await post(`/orders/${orderId}/cancel`);
      return { success: true, message: '訂單已取消' };
    } catch (error) {
      console.error('[API Error] cancelOrder:', error);
      throw error;
    }
  }

  console.log('[Mock API] Cancel order:', orderId);
  await delay(400);
  const order = mockOrdersData.find((o) => o.orderId === orderId);
  if (!order) throw new Error('訂單不存在');
  order.status = 'cancelled';
  return { success: true, message: '訂單已取消' };
};

/**
 * 確認收貨
 */
export const confirmDelivery = async (orderId: string): Promise<ApiResponse> => {
  if (!USE_MOCK_API) {
    try {
      await patch(`/orders/${orderId}/status`, { status: 'completed' });
      return { success: true, message: '已確認收貨' };
    } catch (error) {
      console.error('[API Error] confirmDelivery:', error);
      throw error;
    }
  }

  console.log('[Mock API] Confirm delivery:', orderId);
  await delay(400);
  const order = mockOrdersData.find((o) => o.orderId === orderId);
  if (!order) throw new Error('訂單不存在');
  order.status = 'completed';
  return { success: true, message: '已確認收貨' };
};

export default {
  createOrder,
  createOrderApi,
  getOrders,
  getOrderDetail,
  cancelOrder,
  confirmDelivery,
};
