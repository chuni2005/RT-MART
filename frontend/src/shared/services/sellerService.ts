// import api from './api'; // TODO: 當實作真實 API 時取消註解
import {
  DashboardData,
  SalesPeriod,
  StoreInfo,
  SellerProduct,
  ProductFormData,
  RecentOrder,
  Discount,
  DiscountFormData
} from '@/types/seller';

/**
 * 賣家服務層
 * 提供所有賣家相關的 API 調用
 */

// ========== Dashboard ==========

/**
 * 獲取 Dashboard 數據
 */
export const getDashboardData = async (period: SalesPeriod): Promise<DashboardData> => {
  // TODO: 替換為真實 API
  // return api.get(`/seller/dashboard?period=${period}`);

  // Mock 數據
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        revenue: period === 'day' ? 15000 : period === 'week' ? 50000 : 180000,
        orderCount: period === 'day' ? 20 : period === 'week' ? 120 : 450,
        chartData: generateMockChartData(period),
        categoryData: generateMockCategoryData(),
        popularProducts: MOCK_POPULAR_PRODUCTS,
        recentOrders: MOCK_RECENT_ORDERS
      });
    }, 500);
  });
};

// ========== Store Settings ==========

/**
 * 獲取商店資訊
 */
export const getStoreInfo = async (): Promise<StoreInfo> => {
  // TODO: return api.get('/seller/store');
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_STORE_INFO), 300);
  });
};

/**
 * 更新商店資訊
 */
export const updateStoreInfo = async (data: StoreInfo): Promise<void> => {
  // TODO: return api.put('/seller/store', data);
  console.log('Updating store info:', data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

// ========== Products ==========

/**
 * 獲取商品列表
 */
export const getProducts = async (): Promise<SellerProduct[]> => {
  // TODO: return api.get('/seller/products');
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PRODUCTS), 500);
  });
};

/**
 * 獲取單個商品
 */
export const getProduct = async (id: string): Promise<SellerProduct> => {
  // TODO: return api.get(`/seller/products/${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const product = MOCK_PRODUCTS.find(p => p.productId === id);
      if (!product) {
        reject(new Error('Product not found'));
      } else {
        resolve(product);
      }
    }, 300);
  });
};

/**
 * 創建商品
 */
export const createProduct = async (data: ProductFormData): Promise<void> => {
  // TODO: return api.post('/seller/products', data);
  console.log('Creating product:', data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 更新商品
 */
export const updateProduct = async (id: string, data: ProductFormData): Promise<void> => {
  // TODO: return api.put(`/seller/products/${id}`, data);
  console.log('Updating product:', id, data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 刪除商品
 */
export const deleteProduct = async (id: string): Promise<void> => {
  // TODO: return api.delete(`/seller/products/${id}`);
  console.log('Deleting product:', id);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 更新商品狀態（上架/下架）
 * @param id - 商品ID
 * @param deletedAt - null 為上架，設定時間為下架
 */
export const updateProductStatus = async (id: string, deletedAt: string | null): Promise<void> => {
  // TODO: return api.patch(`/seller/products/${id}/status`, { deletedAt });
  console.log('Updating product status:', id, deletedAt ? 'inactive' : 'active');
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 啟用商品（上架）
 */
export const activateProduct = async (id: string): Promise<void> => {
  return updateProductStatus(id, null);
};

/**
 * 停用商品（下架）
 */
export const deactivateProduct = async (id: string): Promise<void> => {
  return updateProductStatus(id, new Date().toISOString());
};

// ========== Orders ==========

/**
 * 獲取訂單列表
 */
export const getOrders = async (status?: string): Promise<any[]> => {
  // TODO: return api.get('/seller/orders', { params: { status } });
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockOrders = MOCK_RECENT_ORDERS.map(order => ({
        ...order,
        items: [
          {
            id: '1',
            productId: '1',
            productName: '無線藍牙耳機',
            productImage: 'https://picsum.photos/100/100?random=1',
            quantity: 1,
            price: 1299
          }
        ],
        shippingAddress: {
          id: '1',
          recipientName: order.buyerName,
          phone: '0912345678',
          city: '台北市',
          district: '大安區',
          postalCode: '106',
          detail: '忠孝東路三段100號',
          isDefault: true
        },
        paymentMethod: 'credit_card',
        subtotal: order.totalAmount,
        shipping: 60,
        discount: 0,
        orderId: order.id,
        userId: '1',
        storeId: '1',
        storeName: '優質商店'
      }));

      if (status && status !== 'all') {
        resolve(mockOrders.filter(order => order.status === status));
      } else {
        resolve(mockOrders);
      }
    }, 500);
  });
};

/**
 * 獲取訂單詳情
 */
export const getOrderDetail = async (id: string): Promise<any> => {
  // TODO: return api.get(`/seller/orders/${id}`);
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      orderId: id,
      orderNumber: 'ORD20250115001',
      userId: '1',
      storeId: '1',
      storeName: '優質商店',
      status: 'paid',
      items: [
        {
          id: '1',
          productId: '1',
          productName: '無線藍牙耳機',
          productImage: 'https://picsum.photos/100/100?random=1',
          quantity: 1,
          price: 1299
        },
        {
          id: '2',
          productId: '3',
          productName: '智能手環',
          productImage: 'https://picsum.photos/100/100?random=3',
          quantity: 1,
          price: 899
        }
      ],
      shippingAddress: {
        id: '1',
        recipientName: '王小明',
        phone: '0912345678',
        city: '台北市',
        district: '大安區',
        postalCode: '106',
        detail: '忠孝東路三段100號',
        isDefault: true
      },
      paymentMethod: 'credit_card',
      note: '請在下午送達',
      subtotal: 2198,
      shipping: 60,
      discount: 0,
      totalAmount: 2258,
      createdAt: '2025-01-15T14:30:00Z',
      updatedAt: '2025-01-15T14:35:00Z',
      paidAt: '2025-01-15T14:35:00Z'
    }), 300);
  });
};

/**
 * 獲取訂單詳情（別名）
 */
export const getOrder = getOrderDetail;

/**
 * 更新訂單狀態
 */
export const updateOrderStatus = async (id: string, status: string, note?: string): Promise<void> => {
  // TODO: return api.patch(`/seller/orders/${id}/status`, { status, note });
  console.log('Updating order status:', id, status, note);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 回覆買家評價
 */
export const replyToReview = async (orderId: string, reviewId: string, reply: string): Promise<void> => {
  // TODO: return api.post(`/seller/orders/${orderId}/reviews/${reviewId}/reply`, { reply });
  console.log('Replying to review:', orderId, reviewId, reply);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ========== Discounts ==========

/**
 * 獲取折扣列表
 */
export const getDiscounts = async (): Promise<Discount[]> => {
  // TODO: return api.get('/seller/discounts');
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DISCOUNTS), 500);
  });
};

/**
 * 獲取單個折扣
 */
export const getDiscount = async (id: string): Promise<Discount> => {
  // TODO: return api.get(`/seller/discounts/${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const discount = MOCK_DISCOUNTS.find(d => d.discountId === id);
      if (!discount) {
        reject(new Error('Discount not found'));
      } else {
        resolve(discount);
      }
    }, 300);
  });
};

/**
 * 創建折扣
 */
export const createDiscount = async (data: DiscountFormData): Promise<void> => {
  // TODO: return api.post('/seller/discounts', data);
  console.log('Creating discount:', data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 更新折扣
 */
export const updateDiscount = async (id: string, data: DiscountFormData): Promise<void> => {
  // TODO: return api.put(`/seller/discounts/${id}`, data);
  console.log('Updating discount:', id, data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 刪除折扣
 */
export const deleteDiscount = async (id: string): Promise<void> => {
  // TODO: return api.delete(`/seller/discounts/${id}`);
  console.log('Deleting discount:', id);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 更新折扣狀態
 */
export const updateDiscountStatus = async (id: string, active: boolean): Promise<void> => {
  // TODO: return api.patch(`/seller/discounts/${id}/status`, { active });
  console.log('Updating discount status:', id, active);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ========== Mock Data ==========

const MOCK_STORE_INFO: StoreInfo = {
  storeId: '1',
  sellerId: '1',
  storeName: '優質商店',
  storeDescription: '提供高品質商品，誠信經營',
  storeAddress: '台北市大安區忠孝東路三段100號',
  storeEmail: 'store@example.com',
  storePhone: '0912345678',
  totalStars: 450,
  averageRating: 4.5,
  totalReviews: 100,
  bankAccountReference: '1234567890123456',
  verified: true,
  verifiedAt: '2025-01-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z'
};

const MOCK_PRODUCTS: SellerProduct[] = [
  {
    productId: '1',
    storeId: '1',
    productTypeId: '1',
    productName: '無線藍牙耳機',
    description: '高音質無線藍牙耳機，支援主動降噪功能',
    price: 1299,
    stock: 50,
    reserved: 5,
    soldCount: 150,
    totalStars: 225,
    averageRating: 4.5,
    totalReviews: 50,
    deletedAt: null,
    images: [
      { imageUrl: 'https://picsum.photos/400/400?random=1', displayOrder: 1 }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  },
  {
    productId: '2',
    storeId: '1',
    productTypeId: '5',
    productName: '運動水壺',
    description: '大容量運動水壺，保溫保冷',
    price: 299,
    stock: 0,
    reserved: 0,
    soldCount: 80,
    totalStars: 120,
    averageRating: 4.0,
    totalReviews: 30,
    deletedAt: '2025-01-10T00:00:00Z',
    images: [
      { imageUrl: 'https://picsum.photos/400/400?random=2', displayOrder: 1 }
    ],
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z'
  },
  {
    productId: '3',
    storeId: '1',
    productTypeId: '1',
    productName: '智能手環',
    description: '多功能智能手環，心率監測、睡眠追蹤',
    price: 899,
    stock: 120,
    reserved: 10,
    soldCount: 200,
    totalStars: 420,
    averageRating: 4.7,
    totalReviews: 90,
    deletedAt: null,
    images: [
      { imageUrl: 'https://picsum.photos/400/400?random=3', displayOrder: 1 }
    ],
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  },
  {
    productId: '4',
    storeId: '1',
    productTypeId: '5',
    productName: '瑜珈墊',
    description: '加厚防滑瑜珈墊，環保材質',
    price: 599,
    stock: 35,
    reserved: 3,
    soldCount: 65,
    totalStars: 132,
    averageRating: 4.4,
    totalReviews: 30,
    deletedAt: null,
    images: [
      { imageUrl: 'https://picsum.photos/400/400?random=4', displayOrder: 1 }
    ],
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  }
];

const MOCK_POPULAR_PRODUCTS = [
  { id: '3', name: '智能手環', image: 'https://picsum.photos/100/100?random=3', salesCount: 200, revenue: 179800 },
  { id: '1', name: '無線藍牙耳機', image: 'https://picsum.photos/100/100?random=1', salesCount: 150, revenue: 194850 },
  { id: '2', name: '運動水壺', image: 'https://picsum.photos/100/100?random=2', salesCount: 80, revenue: 23920 },
  { id: '4', name: '瑜珈墊', image: 'https://picsum.photos/100/100?random=4', salesCount: 65, revenue: 38935 }
];

const MOCK_RECENT_ORDERS: RecentOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD20250115001',
    buyerName: '王小明',
    itemCount: 2,
    totalAmount: 1598,
    status: 'paid',
    createdAt: '2025-01-15 14:30'
  },
  {
    id: '2',
    orderNumber: 'ORD20250115002',
    buyerName: '李小華',
    itemCount: 1,
    totalAmount: 899,
    status: 'processing',
    createdAt: '2025-01-15 13:20'
  },
  {
    id: '3',
    orderNumber: 'ORD20250115003',
    buyerName: '張大明',
    itemCount: 3,
    totalAmount: 2197,
    status: 'shipped',
    createdAt: '2025-01-15 11:45'
  },
  {
    id: '4',
    orderNumber: 'ORD20250114001',
    buyerName: '陳小美',
    itemCount: 1,
    totalAmount: 599,
    status: 'delivered',
    createdAt: '2025-01-14 16:10'
  },
  {
    id: '5',
    orderNumber: 'ORD20250114002',
    buyerName: '林志明',
    itemCount: 2,
    totalAmount: 1798,
    status: 'completed',
    createdAt: '2025-01-14 10:30'
  }
];

const MOCK_DISCOUNTS: Discount[] = [
  {
    discountId: '1',
    discountCode: 'NEWYEAR2025',
    discountType: 'special',
    name: '新年特惠',
    description: '新年限時優惠，全館商品享折扣',
    minPurchaseAmount: 1000,
    startDatetime: '2025-01-01T00:00:00Z',
    endDatetime: '2025-01-31T23:59:59Z',
    isActive: true,
    usageLimit: 100,
    usageCount: 50,
    storeId: '1',
    productTypeId: null,
    discountRate: 0.15,
    maxDiscountAmount: 500,
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    discountId: '2',
    discountCode: 'ELECTRONICS10',
    discountType: 'special',
    name: '電子產品折扣',
    description: '電子產品類別專屬折扣',
    minPurchaseAmount: 500,
    startDatetime: '2025-01-10T00:00:00Z',
    endDatetime: '2025-01-25T23:59:59Z',
    isActive: true,
    usageLimit: 50,
    usageCount: 12,
    storeId: '1',
    productTypeId: '1',
    discountRate: 0.10,
    maxDiscountAmount: 300,
    createdAt: '2025-01-10T00:00:00Z'
  },
  {
    discountId: '3',
    discountCode: 'SPORTS20',
    discountType: 'special',
    name: '運動用品優惠',
    description: '運動休閒類商品限時優惠',
    minPurchaseAmount: 300,
    startDatetime: '2024-12-20T00:00:00Z',
    endDatetime: '2025-01-10T23:59:59Z',
    isActive: false,
    usageLimit: 30,
    usageCount: 30,
    storeId: '1',
    productTypeId: '5',
    discountRate: 0.20,
    maxDiscountAmount: 200,
    createdAt: '2024-12-20T00:00:00Z'
  }
];

/**
 * 生成折線圖數據的輔助函數（營業額趨勢）
 */
function generateMockChartData(period: SalesPeriod) {
  const labels = period === 'day' ?
    Array.from({length: 24}, (_, i) => `${i}:00`) :
    period === 'week' ?
    ['週一', '週二', '週三', '週四', '週五', '週六', '週日'] :
    Array.from({length: 30}, (_, i) => `${i+1}日`);

  return labels.map(label => ({
    label,
    value: Math.floor(Math.random() * 10000) + 5000
  }));
}

/**
 * 生成圓餅圖數據的輔助函數（類別銷售佔比）
 */
function generateMockCategoryData() {
  return [
    { label: '電子產品', value: 45000 },
    { label: '服飾配件', value: 28000 },
    { label: '食品飲料', value: 15000 },
    { label: '居家生活', value: 22000 },
    { label: '運動休閒', value: 18000 }
  ];
}

export default {
  getDashboardData,
  getStoreInfo,
  updateStoreInfo,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  activateProduct,
  deactivateProduct,
  getOrders,
  getOrder,
  getOrderDetail,
  updateOrderStatus,
  replyToReview,
  getDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  updateDiscountStatus
};
