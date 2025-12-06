import type { CartItem, GetCartResponse } from '@/types';

// TODO: Replace with real backend API calls
// Mock data for development (4 items across 3 stores)
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

// Helper function to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get all cart items for current user
 * TODO: Replace with GET /api/v1/cart
 */
export const getCartItems = async (): Promise<GetCartResponse> => {
  await delay(400);

  return {
    success: true,
    items: [...mockCartItems],
    total: mockCartItems.length,
  };
};

/**
 * Add item to cart
 * TODO: Replace with POST /api/v1/cart
 */
export const addToCart = async (
  productId: string,
  quantity: number
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  // Check if item already exists in cart
  const existingItem = mockCartItems.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
    return {
      success: true,
      message: '商品數量已更新',
    };
  }

  // TODO: Fetch product details from productService
  const newItem: CartItem = {
    id: `cart_${Date.now()}`,
    productId,
    productName: '新商品', // TODO: Get from product API
    productImage: 'https://picsum.photos/300/300',
    price: 999,
    quantity,
    stock: 50,
    selected: true,
    // Default store info (TODO: Get from product API)
    storeId: 'store_001',
    storeName: '科技生活旗艦店',
  };

  mockCartItems.push(newItem);

  return {
    success: true,
    message: '已加入購物車',
  };
};

/**
 * Update cart item quantity
 * TODO: Replace with PUT /api/v1/cart/:itemId
 */
export const updateCartItemQuantity = async (
  itemId: string,
  quantity: number
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  const item = mockCartItems.find((item) => item.id === itemId);

  if (!item) {
    throw new Error('購物車項目不存在');
  }

  if (quantity <= 0) {
    throw new Error('數量必須大於 0');
  }

  if (quantity > item.stock) {
    throw new Error(`庫存不足，目前僅剩 ${item.stock} 件`);
  }

  item.quantity = quantity;

  return {
    success: true,
    message: '數量已更新',
  };
};

/**
 * Remove item from cart
 * TODO: Replace with DELETE /api/v1/cart/:itemId
 */
export const removeFromCart = async (
  itemId: string
): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  const index = mockCartItems.findIndex((item) => item.id === itemId);

  if (index === -1) {
    throw new Error('購物車項目不存在');
  }

  mockCartItems.splice(index, 1);

  return {
    success: true,
    message: '已從購物車移除',
  };
};

/**
 * Clear all items from cart
 * TODO: Replace with DELETE /api/v1/cart
 */
export const clearCart = async (): Promise<{ success: boolean; message: string }> => {
  await delay(300);

  mockCartItems.length = 0;

  return {
    success: true,
    message: '購物車已清空',
  };
};

/**
 * Toggle cart item selection status
 * TODO: Replace with PUT /api/v1/cart/:itemId/select
 */
export const toggleCartItemSelection = async (
  itemId: string,
  selected: boolean
): Promise<{ success: boolean; message: string }> => {
  await delay(200);

  const item = mockCartItems.find((item) => item.id === itemId);

  if (!item) {
    throw new Error('購物車項目不存在');
  }

  item.selected = selected;

  return {
    success: true,
    message: selected ? '已選取' : '已取消選取',
  };
};

/**
 * Select/deselect all cart items
 * TODO: Replace with PUT /api/v1/cart/select-all
 */
export const selectAllCartItems = async (
  selected: boolean
): Promise<{ success: boolean; message: string }> => {
  await delay(200);

  mockCartItems.forEach((item) => {
    item.selected = selected;
  });

  return {
    success: true,
    message: selected ? '已全選' : '已取消全選',
  };
};

/**
 * Select/deselect all items from a specific store
 * TODO: Replace with PUT /api/v1/cart/select-store/:storeId
 */
export const selectStoreItems = async (
  storeId: string,
  selected: boolean
): Promise<{ success: boolean; message: string }> => {
  await delay(200);

  let affectedCount = 0;
  mockCartItems.forEach((item) => {
    if (item.storeId === storeId) {
      item.selected = selected;
      affectedCount++;
    }
  });

  return {
    success: true,
    message: `已${selected ? '選取' : '取消選取'} ${affectedCount} 個商品`,
  };
};
