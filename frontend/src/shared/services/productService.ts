/**
 * Product Service - Mock API
 */

import { get } from './api';
import type { Product, ProductType, Store } from '@/types';

// ============================================
// 設定與環境變數
// ============================================

// 從環境變數控制是否使用 Mock API (預設為 false)
// 在 .env 檔案中設定 VITE_USE_MOCK_API=true 來開啟 Mock 模式
const USE_MOCK_API = (import.meta as any).env.VITE_USE_MOCK_API === 'true';

console.log(`[ProductService] Current Mode: ${USE_MOCK_API ? 'MOCK' : 'REAL API'}`);

// ============================================
// 介面定義 (API Response Types)
// ============================================

/**
 * 後端 Storefront API 回應的單一商品結構
 */
interface BackendStorefrontProduct {
  productId: string;
  productName: string;
  description: string;
  price: string;        // 後端 decimal 類型通常轉為 string 回傳
  currentPrice: number; // 計算後的現價
  discountRate: number; // 折扣率
  isActive: boolean;
  averageRating: string; // decimal string
  soldCount: string;    // bigint string
  totalReviews: number;
  images: { imageUrl: string; displayOrder: number }[];
  store: {
    storeId: string;
    storeName: string;
    storeDescription?: string;
    storeAddress?: string;
    storeEmail?: string;
    storePhone?: string;
    averageRating: string;
    totalRatings: number;
    createdAt: string;
    avatar?: string;
    productCount?: number;
  };
  productType: {
    productTypeId: string;
    typeName: string;
    typeCode: string;
    parentTypeId: string | null;
    isActive: boolean;
  };
  inventory: {
    quantity: number;
  };
}

/**
 * 後端 Storefront API 回應結構
 */
interface BackendStorefrontResponse {
  success: boolean;
  message: string;
  products: BackendStorefrontProduct[];
  total: number;
  page: number;
  limit: number;
}


/**
 * 取得商品詳情的 API 回應
 */
export interface GetProductResponse {
  success: boolean;
  message?: string;
  product: Product;
}

/**
 * 取得商品列表的 API 回應
 */
export interface GetProductsResponse {
  success: boolean;
  message?: string;
  products: Product[];
  total: number;
}

/**
 * 查詢商品的參數
 */
export interface GetProductsParams {
  storeId?: string;
  productTypeId?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'rating' | 'soldCount' | 'createdAt';
  order?: 'asc' | 'desc';
}

// ============================================
// Mock 資料 (開發測試用 - 接入 API 後要刪除)
// ============================================

/**
 * Mock 商店資料 (用於產品關聯)
 */
const mockStores: Record<string, Store> = {
  store_001: {
    id: "store_001",
    name: "科技生活旗艦店",
    avatar: "https://i.pravatar.cc/150?img=10",
    productCount: 30,
    rating: 4.8,
    totalRatings: 150,
    joinDate: "2023/01",
    description: "專營3C電子產品、智能家居和配件。",
    address: "台北市大安區忠孝東路三段 100 號",
    email: "contact@techlife.com",
    phone: "02-2345-6789",
  },
  store_002: {
    id: "store_002",
    name: "時尚服飾精品館",
    avatar: "https://i.pravatar.cc/150?img=20",
    productCount: 45,
    rating: 4.6,
    totalRatings: 89,
    joinDate: "2023/03",
    description: "提供最新潮流服飾，從休閒到正式場合應有盡有。",
    address: "台北市信義區信義路五段 7 號",
    email: "info@fashion.com",
    phone: "02-8765-4321",
  },
  store_003: {
    id: "store_003",
    name: "居家生活館",
    avatar: "https://i.pravatar.cc/150?img=30",
    productCount: 60,
    rating: 4.9,
    totalRatings: 203,
    joinDate: "2022/11",
    description: "打造舒適居家環境，各式家居用品任您選擇。",
    address: "新北市板橋區中山路一段 152 號",
    email: "service@homeliving.com",
    phone: "02-2987-6543",
  },
};

/**
 * Mock 商品類型資料
 */
const mockProductTypes: Record<string, ProductType> = {
  electronics: {
    productTypeId: "electronics",
    typeCode: "ELEC",
    typeName: "電子產品",
    parentTypeId: null,
    isActive: true,
  },
  clothing: {
    productTypeId: "clothing",
    typeCode: "CLOTH",
    typeName: "服飾",
    parentTypeId: null,
    isActive: true,
  },
  home: {
    productTypeId: "home",
    typeCode: "HOME",
    typeName: "家居用品",
    parentTypeId: null,
    isActive: true,
  },
  accessories: {
    productTypeId: "accessories",
    typeCode: "ACC",
    typeName: "配件",
    parentTypeId: null,
    isActive: true,
  },
};

/**
 * 生成 Mock 商品資料
 */
const generateMockProducts = (): Product[] => {
  const productNames = [
    "藍牙耳機", "智能手錶", "無線滑鼠", "機械鍵盤", "USB-C 充電線",
    "T恤", "牛仔褲", "連帽外套", "運動鞋", "棒球帽",
    "沙發", "書桌", "檯燈", "收納箱", "抱枕",
    "手機殼", "螢幕保護貼", "行動電源", "車用支架", "耳機套",
  ];

  const typeIds = ["electronics", "clothing", "home", "accessories"];
  const storeIds = ["store_001", "store_002", "store_003"];

  return Array.from({ length: 60 }, (_, i) => {
    const typeId = typeIds[i % typeIds.length];
    const storeId = storeIds[i % storeIds.length];

    return {
      id: i + 1,
      name: productNames[i % productNames.length] + ` ${Math.floor(i / productNames.length) + 1}`,
      currentPrice: 299 + (i * 50),
      originalPrice: i % 3 === 0 ? 399 + (i * 50) : null,
      description: `優質${mockProductTypes[typeId].typeName}，值得信賴。精心挑選材質，嚴格品質把關，為您帶來最佳使用體驗。`,
      stock: 100 - (i % 50),
      rating: 4 + Math.random(),
      reviewCount: Math.floor(Math.random() * 100),
      soldCount: Math.floor(Math.random() * 1000),
      images: [
        `https://picsum.photos/seed/${i + 1}/400/400`,
        `https://picsum.photos/seed/${i + 100}/400/400`,
        `https://picsum.photos/seed/${i + 200}/400/400`,
      ],
      store: mockStores[storeId],
      productType: mockProductTypes[typeId],
    };
  });
};

/**
 * Mock 商品資料庫
 */
const mockProducts = generateMockProducts();

// ============================================
// 輔助函數
// ============================================

/**
 * 將後端商品類型資料轉換為前端使用的格式
 */
const mapBackendProductType = (data: any): ProductType => {
  if (!data) return {} as ProductType;
  return {
    productTypeId: data.productTypeId,
    typeName: data.typeName,
    typeCode: data.typeCode || 'UNKNOWN',
    parentTypeId: data.parentTypeId,
    isActive: data.isActive ?? true,
    // 支援遞迴結構
    parent: data.parent ? mapBackendProductType(data.parent) : undefined,
  };
};

/**
 * 模擬 API 延遲
 * @param ms - 延遲毫秒數，預設 500ms
 */
const mockDelay = (ms = 500): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// Service 函數
// ============================================


/**
 * 根據 ID 取得商品詳情
 */
export const getProductById = async (
  productId: string | number
): Promise<GetProductResponse> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      const response = await get<{ success: boolean; message: string; product: BackendStorefrontProduct }>(
        `/products/storefront/${productId}`
      );
      
      const p = response.product;
      const product: Product = {
        id: Number(p.productId),
        name: p.productName,
        description: p.description || '',
        currentPrice: Number(p.currentPrice),
        originalPrice: Number(p.price) !== Number(p.currentPrice) ? Number(p.price) : null,
        stock: p.inventory?.quantity || 0,
        rating: Number(p.averageRating) || 0,
        reviewCount: p.totalReviews || 0,
        soldCount: Number(p.soldCount) || 0,
        images: p.images?.sort((a, b) => a.displayOrder - b.displayOrder).map(img => img.imageUrl) || [],
        store: {
          id: p.store.storeId,
          name: p.store.storeName,
          avatar: p.store.avatar || "https://i.pravatar.cc/150?img=10",
          rating: Number(p.store.averageRating) || 0,
          productCount: p.store.productCount || 0,
          totalRatings: p.store.totalRatings || 0,
          joinDate: p.store.createdAt || "",
          description: p.store.storeDescription || "",
          address: p.store.storeAddress || "",
          email: p.store.storeEmail || "",
          phone: p.store.storePhone || ""
        },
        productType: mapBackendProductType(p.productType)
      };

      return {
        success: true,
        message: '成功取得商品資訊',
        product,
      };
    } catch (error) {
      console.error('[API Error] getProductById:', error);
      throw error;
    }
  }

  // Mock Mode
  console.log('[Mock API] Get product by ID:', productId);

  // 模擬網路延遲
  await mockDelay(500);

  // 查找商品
  const product = mockProducts.find(p => p.id === Number(productId));

  if (!product) {
    throw new Error(`商品不存在 (ID: ${productId})`);
  }

  return {
    success: true,
    message: '成功取得商品資訊',
    product,
  };
};

/**
 * 根據條件查詢商品列表
 */
export const getProducts = async (
  params: GetProductsParams = {}
): Promise<GetProductsResponse> => {

  // ------------------------------------------------
  // Real API Mode
  // ------------------------------------------------
  if (!USE_MOCK_API) {
    try {
      const queryParams: any = {
        page: params.page,
        limit: params.limit,
        keyword: params.keyword, // 新 API 使用 keyword
        storeId: params.storeId,
        productTypeId: params.productTypeId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        minRating: params.minRating, // 新 API 支援 minRating
        sortBy: params.sortBy,
        sortOrder: params.order?.toUpperCase(),
      };

      const queryString = new URLSearchParams(
        Object.entries(queryParams).filter(([_, v]) => v != null) as [string, string][]
      ).toString();

      // 改為呼叫 storefront 專用 API
      const response = await get<BackendStorefrontResponse>(`/products/storefront?${queryString}`);

      return {
        success: true,
        message: '成功取得商品列表',
        products: response.products.map(p => ({
          id: Number(p.productId),
          name: p.productName,
          description: p.description || '',
          currentPrice: Number(p.currentPrice), // 使用後端計算好的現價
          // 如果原價與現價不同，則設定原價；否則為 null
          originalPrice: Number(p.price) !== Number(p.currentPrice) ? Number(p.price) : null,
          stock: p.inventory?.quantity || 0,
          rating: Number(p.averageRating) || 0,
          reviewCount: p.totalReviews || 0,
          soldCount: Number(p.soldCount) || 0,
          // 確保圖片按順序排列
          images: p.images?.sort((a, b) => a.displayOrder - b.displayOrder).map(img => img.imageUrl) || [],
          store: {
            id: p.store.storeId,
            name: p.store.storeName,
            // TODO: 後端 Storefront API 目前可能未回傳以下欄位，暫時使用預設值或從 Store 物件中取值
            avatar: "https://i.pravatar.cc/150?img=10", // Placeholder
            rating: Number(p.store.averageRating) || 0,
          productCount: p.store.productCount || 0,
          totalRatings: p.store.totalRatings || 0,
          joinDate: p.store.createdAt || "",
          description: p.store.storeDescription || "",
          address: p.store.storeAddress || "",
          email: p.store.storeEmail || "",
          phone: p.store.storePhone || ""
        },
        productType: mapBackendProductType(p.productType)
      })),
        total: response.total,
      };
    } catch (error) {
      console.error('[API Error] getProducts:', error);
      throw error;
    }
  }

  // ------------------------------------------------
  // Mock Mode
  // ------------------------------------------------
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // const queryString = new URLSearchParams(params as any).toString();
  // return get<GetProductsResponse>(`/products?${queryString}`);

  console.log('[Mock API] Get products with params:', params);

  // 模擬網路延遲
  await mockDelay(600);

  let filteredProducts = [...mockProducts];

  // 依條件過濾
  if (params.storeId) {
    filteredProducts = filteredProducts.filter(p => p.store.id === params.storeId);
  }

  if (params.productTypeId) {
    filteredProducts = filteredProducts.filter(
      p => p.productType?.productTypeId === params.productTypeId
    );
  }

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredProducts = filteredProducts.filter(
      p =>
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
    );
  }

  // 價格範圍過濾
  if (params.minPrice !== undefined && params.minPrice !== null) {
    filteredProducts = filteredProducts.filter(p => p.currentPrice >= params.minPrice!);
  }

  if (params.maxPrice !== undefined && params.maxPrice !== null) {
    filteredProducts = filteredProducts.filter(p => p.currentPrice <= params.maxPrice!);
  }

  // 評價過濾
  if (params.minRating !== undefined && params.minRating !== null) {
    filteredProducts = filteredProducts.filter(p => p.rating >= params.minRating!);
  }

  // 排序
  if (params.sortBy) {
    filteredProducts.sort((a, b) => {
      const order = params.order === 'desc' ? -1 : 1;

      switch (params.sortBy) {
        case 'price':
          return (a.currentPrice - b.currentPrice) * order;
        case 'rating':
          return (a.rating - b.rating) * order;
        case 'soldCount':
          return (a.soldCount - b.soldCount) * order;
        default:
          return 0;
      }
    });
  }

  // 分頁
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    success: true,
    message: '成功取得商品列表',
    products: paginatedProducts,
    total: filteredProducts.length,
  };
};

/**
 * 根據商店 ID 取得該商店的所有商品 (Mock 版本)
 * @param storeId - 商店 ID
 * @returns 商品列表回應
 */
export const getProductsByStore = async (
  storeId: string,
  params: Omit<GetProductsParams, 'storeId'> = {}
): Promise<GetProductsResponse> => {
  return getProducts({ ...params, storeId });
};

/**
 * 根據類型 ID 取得該類型的所有商品 (Mock 版本)
 * @param productTypeId - 商品類型 ID
 * @returns 商品列表回應
 */
export const getProductsByType = async (
  productTypeId: string,
  params: Omit<GetProductsParams, 'productTypeId'> = {}
): Promise<GetProductsResponse> => {
  return getProducts({ ...params, productTypeId });
};

/**
 * 取得單一商品類型
 */
export const getProductTypeById = async (
  productTypeId: string
): Promise<ProductType | undefined> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      const response = await get<any>(`/product-types/${productTypeId}`);
      return mapBackendProductType(response);
    } catch (error) {
      console.error("[API Error] getProductTypes:", error);
      throw error;
    }
  }

  // Mock Mode
  console.log("[Mock API] Get product type by ID:", productTypeId);

  // 模擬網路延遲
  await mockDelay(300);

  // 返回特定分類 (可能為 undefined)
  return mockProductTypes[productTypeId];
};

/**
 * 取得所有商品類型
 */
export const getProductTypes = async (): Promise<ProductType[]> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      const response = await get<any[]>('/product-types');
      return response.map(mapBackendProductType);
    } catch (error) {
      console.error('[API Error] getProductTypes:', error);
      throw error;
    }
  }

  // Mock Mode
  console.log('[Mock API] Get all product types');

  // 模擬網路延遲
  await mockDelay(300);

  // 返回所有分類
  return Object.values(mockProductTypes).map(mapBackendProductType);
};

// ============================================
// 預設匯出
// ============================================

export default {
  getProductById,
  getProducts,
  getProductsByStore,
  getProductsByType,
  getProductTypes,
};