import api from './api';
import {
  DashboardData,
  SalesPeriod,
  StoreInfo,
  SellerProduct,
  ProductFormData,
  RecentOrder,
  Discount,
  DiscountFormData,
  SellerApplicationForm
} from '@/types/seller';

/**
 * 賣家服務層
 * 提供所有賣家相關的 API 調用
 */

// ========== Seller Application ==========

/**
 * 申請成為賣家
 * POST /sellers
 */
export const applyToBeSeller = async (
  data: SellerApplicationForm
): Promise<{ success: boolean; message: string }> => {
  try {
    // 調用後端 API
    // userId 會從 JWT token 自動獲取
    await api.post('/sellers', {
      bankAccountReference: data.bank_account_reference,
    });

    return {
      success: true,
      message: '您的賣家申請已提交成功！我們將在 1-3 個工作天內完成審核。',
    };
  } catch (error: any) {
    console.error('申請成為賣家失敗:', error);

    // 處理特定錯誤
    if (error.message?.includes('already a seller')) {
      throw new Error('您已經是賣家了');
    }
    if (error.message?.includes('Only buyers can become sellers')) {
      throw new Error('只有買家可以申請成為賣家');
    }

    throw new Error(error.message || '申請提交失敗，請稍後再試');
  }
};

// ========== Dashboard ==========

/**
 * 獲取 Dashboard 數據
 * 目前後端尚未提供整合的 Dashboard API，暫時保留 Mock
 */
export const getDashboardData = async (period: SalesPeriod): Promise<DashboardData> => {
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
 * 獲取商店資訊 (整合 Seller 數據)
 */
export const getStoreInfo = async (): Promise<StoreInfo> => {
  const response = await api.get<any>('/stores/me');
  const s = response;
  
  return {
    storeId: s.storeId,
    sellerId: s.sellerId,
    storeName: s.storeName,
    storeDescription: s.storeDescription,
    storeAddress: s.storeAddress,
    storeEmail: s.storeEmail,
    storePhone: s.storePhone,
    averageRating: Number(s.averageRating),
    totalReviews: s.productCount, // 暫時以產品數代之或後端對齊
    bankAccountReference: s.seller?.bankAccountReference,
    verified: s.seller?.verified,
    verifiedAt: s.seller?.verifiedAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

/**
 * 更新商店資訊
 */
export const updateStoreInfo = async (data: Partial<StoreInfo>): Promise<void> => {
  await api.patch('/stores', data);
};

// ========== Products ==========

/**
 * 獲取商品列表
 */
export const getProducts = async (): Promise<SellerProduct[]> => {
  // 先獲取當前商店資訊以取得 storeId
  const store = await getStoreInfo();
  if (!store.storeId) throw new Error('Store ID not found');

  const queryParams = { storeId: store.storeId, limit: '100' };
  const queryString = new URLSearchParams(queryParams).toString();

  const response = await api.get<{ data: any[]; total: number }>(`/products/seller?${queryString}`);

  return response.data.map(p => transformSellerProduct(p));
};

/**
 * 獲取單個商品
 */
export const getProduct = async (id: string): Promise<SellerProduct> => {
  const response = await api.get<any>(`/products/seller/${id}`);
  return transformSellerProduct(response);
};

/**
 * 創建商品
 */
export const createProduct = async (data: ProductFormData): Promise<void> => {
  const formData = new FormData();
  formData.append('productName', data.productName);
  formData.append('description', data.description);
  formData.append('price', data.price.toString());
  formData.append('productTypeId', data.productTypeId);
  formData.append('initialStock', data.stock.toString());

  // 處理圖片上傳
  if (data.images && data.images.length > 0) {
    data.images.forEach((img) => {
      if (img.file) {
        formData.append('images', img.file);
      }
    });
  }

  await api.post('/products', formData);
};

/**
 * 更新商品
 */
export const updateProduct = async (
  id: string,
  data: Partial<ProductFormData>,
): Promise<void> => {
  // 1. 更新基本資訊
  const updateData: any = { ...data };
  delete updateData.stock;
  delete updateData.images;
  delete updateData.removedImageIds;

  if (Object.keys(updateData).length > 0) {
    await api.patch(`/products/${id}`, updateData);
  }

  // 2. 更新庫存
  if (data.stock !== undefined) {
    await api.patch(`/inventory/product/${id}`, { quantity: data.stock });
  }

  // 3. 處理圖片刪除
  if (data.removedImageIds && data.removedImageIds.length > 0) {
    await Promise.all(
      data.removedImageIds.map((imageId) => deleteProductImage(id, imageId))
    );
  }

  // 4. 處理圖片上傳與排序
  if (data.images && data.images.length > 0) {
    const imagesToProcess = data.images;
    const newImages = imagesToProcess.filter((img) => img.file);
    const existingImages = imagesToProcess.filter((img) => img.imageId);

    // 如果有新圖片，先上傳
    if (newImages.length > 0) {
      const imageFormData = new FormData();
      newImages.forEach((img) => {
        if (img.file) {
          imageFormData.append("images", img.file);
        }
      });
      await api.post<any>(
        `/products/${id}/images`,
        imageFormData
      );
    }

    // 執行最終排序
    const finalSortData: { imageId: string; order: number }[] = [];
    
    // 重新獲取產品以確保拿到所有最新的 imageId
    const latestProduct = await getProduct(id);
    const latestImages = latestProduct.images || [];

    imagesToProcess.forEach((img, index) => {
      // 尋找對應的 imageId
      let imageId = img.imageId;
      
      if (!imageId && img.file) {
        // 這是剛上傳的新圖片，從 latestImages 中尋找匹配的
        const newImgsInData = imagesToProcess.filter(i => i.file);
        const newImgIndex = newImgsInData.indexOf(img);
        
        // 獲取 latestImages 中原本不存在於 existingImages 的圖片
        const existingIds = new Set(existingImages.map(i => i.imageId));
        const trulyNewImages = latestImages.filter(i => !existingIds.has(i.imageId));
        
        if (trulyNewImages[newImgIndex]) {
          imageId = trulyNewImages[newImgIndex].imageId;
        }
      }
      
      if (imageId) {
        finalSortData.push({
          imageId,
          order: index + 1
        });
      }
    });

    if (finalSortData.length > 0) {
      await sortProductImages(id, finalSortData);
    }
  }
};

/**
 * 刪除商品圖片
 */
export const deleteProductImage = async (productId: string, imageId: string): Promise<void> => {
  await api.delete(`/products/${productId}/images/${imageId}`);
};

/**
 * 排序商品圖片
 */
export const sortProductImages = async (
  productId: string,
  images: { imageId: string; order: number }[]
): Promise<void> => {
  await api.patch(`/products/${productId}/images/sort`, { images });
};

/**
 * 刪除商品
 */
export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

/**
 * 更新商品狀態（上架/下架）
 * 使用 isActive 欄位
 */
export const updateProductStatus = async (id: string, active: boolean): Promise<void> => {
  await api.patch(`/products/${id}`, { isActive: active });
};

/**
 * 啟用商品（上架）
 */
export const activateProduct = async (id: string): Promise<void> => {
  return updateProductStatus(id, true);
};

/**
 * 停用商品（下架）
 */
export const deactivateProduct = async (id: string): Promise<void> => {
  return updateProductStatus(id, false);
};

// ========== Orders ==========

/**
 * 轉換後端訂單項目數據為前端格式
 */
const transformOrderItem = (item: any) => ({
  id: item.orderItemId,
  productId: item.productId || item.productSnapshot?.productId,
  productName: item.productSnapshot?.product_name || item.productSnapshot?.productName || 'Unknown Product',
  productImage: item.productSnapshot?.images?.[0]?.imageUrl || '',
  quantity: item.quantity || 0,
  price: Number(item.unitPrice || item.price || 0),
});

/**
 * 轉換後端訂單數據為前端格式
 */
const transformOrder = (order: any) => {
  const transformed: any = {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    userId: order.userId,
    storeId: order.storeId,
    storeName: order.store?.storeName || 'Unknown Store',
    status: order.orderStatus,
    shippingAddress: order.shippingAddressSnapshot,
    paymentMethod: order.paymentMethod,
    note: order.notes || '',
    subtotal: Number(order.subtotal || 0),
    shipping: Number(order.shippingFee || 0),
    discount: Number(order.totalDiscount || 0),
    totalAmount: Number(order.totalAmount || 0),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
  };

  // Only include items if they exist (detail endpoint returns items, list endpoint doesn't)
  if (order.items && order.items.length > 0) {
    transformed.items = order.items.map(transformOrderItem);
  }

  return transformed;
};

/**
 * 獲取訂單列表
 */
export const getOrders = async (status?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (status && status !== 'all') {
    params.append('status', status);
  }

  const response = await api.get<{ data: any[] }>(`/orders/seller/orders?${params.toString()}`);
  return response.data.map(transformOrder);
};

/**
 * 獲取訂單詳情
 */
export const getOrderDetail = async (id: string): Promise<any> => {
  const order = await api.get(`/orders/seller/orders/${id}`);
  return transformOrder(order);
};

export const getOrder = getOrderDetail;

/**
 * 更新訂單狀態
 */
export const updateOrderStatus = async (id: string, status: string, note?: string): Promise<void> => {
  try {
    await api.patch(`/orders/seller/orders/${id}/status`, { status, note });
  } catch (error: any) {
    console.error('更新訂單狀態失敗:', error);

    const errorMessage = error.message || '';

    // 根據後端錯誤訊息映射到前端友善訊息
    // 1. 訂單不存在
    if (errorMessage.includes('not found')) {
      throw new Error('訂單不存在，請重新整理頁面後再試。');
    }

    // 2. 權限不足
    if (errorMessage.includes('permission')) {
      throw new Error('您沒有權限修改此訂單。');
    }

    // 3. 賣家無法標記為已完成
    if (errorMessage.includes('cannot mark orders as completed')) {
      throw new Error('賣家無法將訂單標記為已完成，只有買家可以確認收貨。');
    }

    // 4. 無效的狀態轉換
    if (errorMessage.includes('cannot transition')) {
      throw new Error('此狀態無法轉換到選擇的狀態，請確認訂單當前狀態。');
    }

    // 5. 庫存保留數量不足
    if (errorMessage.includes('Reserved quantity is not enougth') || errorMessage.includes('Reserved quantity')) {
      throw new Error('庫存保留數量不足，無法完成此操作。請聯繫技術支援。');
    }

    // 6. 賣家帳號問題
    if (errorMessage.includes('Seller not found')) {
      throw new Error('賣家帳號異常，請重新登入。');
    }

    // 7. 網路問題
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      throw new Error('網路連線異常，請檢查網路後重試。');
    }

    // 如果沒有匹配到特定錯誤，使用通用訊息
    throw new Error('更新訂單狀態失敗，請稍後再試。');
  }
};

// ========== Discounts ==========

/**
 * 獲取折扣列表
 */
export const getDiscounts = async (): Promise<Discount[]> => {
  const response = await api.get<{ data: any[] }>('/discounts');
  return response.data.map(d => transformDiscount(d));
};

/**
 * 獲取單個折扣
 */
export const getDiscount = async (id: string): Promise<Discount> => {
  const response = await api.get<any>(`/discounts/${id}`);
  return transformDiscount(response);
};

/**
 * 創建折扣
 */
export const createDiscount = async (data: DiscountFormData): Promise<void> => {
  const store = await getStoreInfo();
  if (!store.storeId) throw new Error('Store ID not found');

  const body = {
    discountCode: data.discountCode,
    name: data.name,
    description: data.description,
    minPurchaseAmount: data.minPurchaseAmount,
    startDatetime: data.startDatetime,
    endDatetime: data.endDatetime,
    usageLimit: data.usageLimit,
    discountType: 'special',
    specialDetails: {
      storeId: store.storeId,
      productTypeId: data.productTypeId,
      discountRate: data.discountRate,
      maxDiscountAmount: data.maxDiscountAmount,
    }
  }

  await api.post('/discounts', body);
};

/**
 * 更新折扣
 */
export const updateDiscount = async (id: string, data: Partial<DiscountFormData>): Promise<void> => {
  const store = await getStoreInfo();
  if (!store.storeId) throw new Error('Store ID not found');

  const body: any = {
    name: data.name,
    description: data.description,
    minPurchaseAmount: data.minPurchaseAmount,
    startDatetime: data.startDatetime,
    endDatetime: data.endDatetime,
    usageLimit: data.usageLimit,
  };

  if (data.discountRate !== undefined || data.maxDiscountAmount !== undefined || data.productTypeId !== undefined) {
    body.specialDetails = {
      storeId: store.storeId,
      productTypeId: data.productTypeId,
      discountRate: data.discountRate,
      maxDiscountAmount: data.maxDiscountAmount,
    };
  }

  await api.patch(`/discounts/${id}`, body);
};

/**
 * 刪除折扣
 */
export const deleteDiscount = async (id: string): Promise<void> => {
  await api.delete(`/discounts/${id}`);
};

/**
 * 更新折扣狀態
 */
export const updateDiscountStatus = async (id: string, active: boolean): Promise<void> => {
  await api.patch(`/discounts/${id}`, { isActive: active });
};

// ========== Helper Functions ==========

const transformSellerProduct = (p: any): SellerProduct => ({
  productId: p.productId,
  storeId: p.storeId,
  productTypeId: p.productTypeId,
  productName: p.productName,
  description: p.description,
  price: Number(p.price),
  stock: p.inventory?.quantity || 0,
  reserved: p.inventory?.reserved || 0,
  soldCount: Number(p.soldCount),
  averageRating: Number(p.averageRating),
  totalReviews: p.totalReviews,
  isActive: p.isActive,
  deletedAt: p.deletedAt,
  images: (p.images || [])
    .map((img: any) => ({
      imageId: img.imageId,
      imageUrl: img.imageUrl,
      displayOrder: img.displayOrder
    }))
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const transformDiscount = (d: any): Discount => ({
  discountId: d.discountId,
  discountCode: d.discountCode,
  discountType: d.discountType,
  name: d.name,
  description: d.description,
  minPurchaseAmount: Number(d.minPurchaseAmount),
  startDatetime: d.startDatetime,
  endDatetime: d.endDatetime,
  isActive: d.isActive,
  usageLimit: d.usageLimit,
  usageCount: d.usageCount,
  storeId: d.specialDiscount?.storeId,
  productTypeId: d.specialDiscount?.productTypeId,
  discountRate: Number(d.specialDiscount?.discountRate),
  maxDiscountAmount: Number(d.specialDiscount?.maxDiscountAmount),
  createdAt: d.createdAt,
});

// ========== Mock Data (Keep for UI parts not yet connected) ==========

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

function generateMockCategoryData() {
  return [
    { label: '電子產品', value: 45000 },
    { label: '服飾配件', value: 28000 },
    { label: '食品飲料', value: 15000 },
    { label: '居家生活', value: 22000 },
    { label: '運動休閒', value: 18000 }
  ];
}

const MOCK_POPULAR_PRODUCTS = [
  { id: '3', name: '智能手環', image: 'https://picsum.photos/100/100?random=3', salesCount: 200, revenue: 179800 },
  { id: '1', name: '無線藍牙耳機', image: 'https://picsum.photos/100/100?random=1', salesCount: 150, revenue: 194850 }
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
  }
];

export default {
  applyToBeSeller,
  getDashboardData,
  getStoreInfo,
  updateStoreInfo,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  updateProductStatus,
  activateProduct,
  deactivateProduct,
  getOrders,
  getOrder,
  getOrderDetail,
  updateOrderStatus,
  getDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  updateDiscountStatus
};
