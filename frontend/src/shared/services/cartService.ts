/**
 * Cart Service - API Integration
 */

import { get, post, patch, del } from './api';
import type { CartItem, GetCartResponse } from '@/types';

// ============================================
// 設定與環境變數
// ============================================

const USE_MOCK_API = (import.meta as any).env.VITE_USE_MOCK_API === 'true';

console.log(`[CartService] Current Mode: ${USE_MOCK_API ? 'MOCK' : 'REAL API'}`);

// ============================================
// 介面定義 (Backend API Response Types)
// ============================================

/**
 * 後端 CartItem Entity 結構 (對應 backend/src/carts/entities/cart-item.entity.ts)
 */
interface BackendCartItem {
  cartItemId: string;
  cartId: string;
  productId: string;
  quantity: number;
  selected: boolean;
  addedAt: string;
  updatedAt: string;
  product: {
    productId: string;
    productName: string;
    price: string | number;
    images?: Array<{ imageUrl: string }>;
    storeId: string;
    store: {
      storeName: string;
    };
    inventory?: {
      quantity: number;
    };
  };
}

/**
 * 後端 Cart Entity 結構 (對應 backend/src/carts/entities/cart.entity.ts)
 */
interface BackendCart {
  cartId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: BackendCartItem[];
}

/**
 * 後端 Summary API 回應結構
 */
interface BackendCartSummaryResponse {
  cart: BackendCart;
  totalItems: number;
  totalAmount: number;
  selectedTotalAmount: number;
}

// ============================================
// Mock 資料 (開發測試用)
// ============================================

const mockCartItems: CartItem[] = [
  {
    id: 'cart_001',
    productId: 'prod_001',
    productName: '無線藍牙耳機 - 降噪版',
    productImage: 'https://picsum.photos/seed/prod001/300/300',
    price: 1299,
    quantity: 2,
    stock: 50,
    selected: true,
    storeId: 'store_001',
    storeName: '科技生活旗艦店',
  },
  {
    id: 'cart_002',
    productId: 'prod_005',
    productName: '智能手環 運動追蹤器',
    productImage: 'https://picsum.photos/seed/prod005/300/300',
    price: 899,
    quantity: 1,
    stock: 30,
    selected: true,
    storeId: 'store_001',
    storeName: '科技生活旗艦店',
  },
  {
    id: 'cart_003',
    productId: 'prod_012',
    productName: 'USB-C 快速充電線 2米',
    productImage: 'https://picsum.photos/seed/prod012/300/300',
    price: 199,
    quantity: 3,
    stock: 100,
    selected: false,
    storeId: 'store_002',
    storeName: '時尚服飾精品館',
  },
  {
    id: 'cart_004',
    productId: 'prod_023',
    productName: '無線滑鼠 靜音設計',
    productImage: 'https://picsum.photos/seed/prod023/300/300',
    price: 349,
    quantity: 1,
    stock: 45,
    selected: true,
    storeId: 'store_003',
    storeName: '居家生活館',
  },
];

// ============================================
// 輔助函數
// ============================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 將後端 CartItem Entity 轉換為前端 CartItem 介面
 */
const transformCartItem = (backendItem: BackendCartItem): CartItem => {
  return {
    id: backendItem.cartItemId,
    productId: backendItem.productId,
    productName: backendItem.product.productName,
    productImage: backendItem.product.images?.[0]?.imageUrl || 'https://via.placeholder.com/300',
    price: Number(backendItem.product.price),
    quantity: backendItem.quantity,
    stock: backendItem.product.inventory?.quantity || 0,
    selected: backendItem.selected,
    storeId: backendItem.product.storeId,
    storeName: backendItem.product.store.storeName,
  };
};

// ============================================
// Service 函數
// ============================================

/**
 * 取得當前使用者的購物車項目
 */
export const getCartItems = async (): Promise<GetCartResponse> => {
  if (USE_MOCK_API) {
    await delay(400);
    return {
      success: true,
      items: [...mockCartItems],
      total: mockCartItems.length,
    };
  }

  try {
    const cart = await get<BackendCart>('/carts');
    const items = cart.items.map(transformCartItem);
    return {
      success: true,
      items,
      total: items.length,
    };
  } catch (error) {
    console.error('[CartService] getCartItems error:', error);
    throw error;
  }
};

/**
 * 加入商品至購物車
 */
export const addToCart = async (
  productId: string,
  quantity: number,
  selected?: boolean
): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_API) {
    await delay(300);
    const existingItem = mockCartItems.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      if (selected !== undefined) existingItem.selected = selected;
    } else {
      mockCartItems.push({
        id: `cart_${Date.now()}`,
        productId,
        productName: '新商品',
        productImage: 'https://picsum.photos/300/300',
        price: 999,
        quantity,
        stock: 50,
        selected: selected ?? true,
        storeId: 'store_001',
        storeName: '科技生活旗艦店',
      });
    }
    return { success: true, message: '已加入購物車' };
  }

  try {
    await post('/carts/items', { productId, quantity, selected });
    return { success: true, message: '已加入購物車' };
  } catch (error: any) {
    console.error('[CartService] addToCart error:', error);
    return { success: false, message: error.message || '加入購物車失敗' };
  }
};

/**
 * 更新購物車項目數量或選取狀態
 */
export const updateCartItem = async (
  itemId: string,
  updates: { quantity?: number; selected?: boolean }
): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_API) {
    await delay(300);
    const item = mockCartItems.find((item) => item.id === itemId);
    if (!item) throw new Error('購物車項目不存在');
    
    if (updates.quantity !== undefined) item.quantity = updates.quantity;
    if (updates.selected !== undefined) item.selected = updates.selected;
    
    return { success: true, message: '更新成功' };
  }

  try {
    await patch(`/carts/items/${itemId}`, updates);
    return { success: true, message: '更新成功' };
  } catch (error: any) {
    console.error('[CartService] updateCartItem error:', error);
    return { success: false, message: error.message || '更新失敗' };
  }
};

/**
 * 批次更新購物車項目選取狀態
 */
export const batchUpdateCartItems = async (
  items: Array<{ cartItemId: string; selected: boolean }>
): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_API) {
    await delay(300);
    items.forEach(update => {
      const item = mockCartItems.find(m => m.id === update.cartItemId);
      if (item) item.selected = update.selected;
    });
    return { success: true, message: '更新成功' };
  }

  try {
    await patch('/carts/items/batch', { items });
    return { success: true, message: '更新成功' };
  } catch (error: any) {
    console.error('[CartService] batchUpdateCartItems error:', error);
    return { success: false, message: error.message || '批次更新失敗' };
  }
};

/**
 * 從購物車移除項目
 */
export const removeFromCart = async (
  itemId: string
): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_API) {
    await delay(300);
    const index = mockCartItems.findIndex((item) => item.id === itemId);
    if (index === -1) throw new Error('購物車項目不存在');
    mockCartItems.splice(index, 1);
    return { success: true, message: '已從購物車移除' };
  }

  try {
    await del(`/carts/items/${itemId}`);
    return { success: true, message: '已從購物車移除' };
  } catch (error: any) {
    console.error('[CartService] removeFromCart error:', error);
    return { success: false, message: error.message || '移除失敗' };
  }
};

/**
 * 清空購物車
 */
export const clearCart = async (): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_API) {
    await delay(300);
    mockCartItems.length = 0;
    return { success: true, message: '購物車已清空' };
  }

  try {
    await del('/carts');
    return { success: true, message: '購物車已清空' };
  } catch (error: any) {
    console.error('[CartService] clearCart error:', error);
    return { success: false, message: error.message || '清空購物車失敗' };
  }
};

/**
 * 移除已選取的項目
 */
export const removeSelectedItems = async (): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_API) {
    await delay(300);
    for (let i = mockCartItems.length - 1; i >= 0; i--) {
      if (mockCartItems[i].selected) {
        mockCartItems.splice(i, 1);
      }
    }
    return { success: true, message: '已移除選取商品' };
  }

  try {
    // 這裡可以使用後端新增的 removeSelectedItems 功能
    // 雖然後端只有在 OrderService 內部呼叫，但我們可以視需要開放 API
    // 目前後端 Controller 尚未開放這個端點，若需要前端主動呼叫需另補端點
    // 暫時以 clearCart 或循環呼叫作為替代方案，或是直接呼叫後端未來可能開放的端點
    // 此處假設後端未來可能開放 DELETE /carts/selected
    await del('/carts/selected'); 
    return { success: true, message: '已移除選取商品' };
  } catch (error: any) {
    console.error('[CartService] removeSelectedItems error:', error);
    return { success: false, message: error.message || '移除失敗' };
  }
};

/**
 * 取得購物車摘要
 */
export const getCartSummary = async (): Promise<{
  success: boolean;
  totalItems: number;
  totalAmount: number;
  selectedTotalAmount: number;
}> => {
  if (USE_MOCK_API) {
    await delay(300);
    const totalItems = mockCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const selectedTotalAmount = mockCartItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      success: true,
      totalItems,
      totalAmount,
      selectedTotalAmount,
    };
  }

  try {
    const data = await get<BackendCartSummaryResponse>('/carts/summary');
    return {
      success: true,
      totalItems: data.totalItems,
      totalAmount: data.totalAmount,
      selectedTotalAmount: data.selectedTotalAmount,
    };
  } catch (error) {
    console.error('[CartService] getCartSummary error:', error);
    throw error;
  }
};

// ============================================
// 為了相容性保留舊的函數名稱並導向新函數
// ============================================

export const updateCartItemQuantity = (itemId: string, quantity: number) => 
  updateCartItem(itemId, { quantity });

export const toggleCartItemSelection = (itemId: string, selected: boolean) => 
  updateCartItem(itemId, { selected });

export const selectAllCartItems = async (selected: boolean) => {
  const { items } = await getCartItems();
  return batchUpdateCartItems(items.map(i => ({ cartItemId: i.id, selected })));
};

export const selectStoreItems = async (storeId: string, selected: boolean) => {
  const { items } = await getCartItems();
  const storeItems = items
    .filter(i => i.storeId === storeId)
    .map(i => ({ cartItemId: i.id, selected }));
  return batchUpdateCartItems(storeItems);
};

export default {
  getCartItems,
  addToCart,
  updateCartItem,
  batchUpdateCartItems,
  removeFromCart,
  clearCart,
  removeSelectedItems,
  getCartSummary,
  // 相容性導出
  updateCartItemQuantity,
  toggleCartItemSelection,
  selectAllCartItems,
  selectStoreItems,
};
