/**
 * Store Service - Mock API
 */

import { get } from './api';
import type { Store } from '@/types';

// ============================================
// 介面定義 (API Response Types)
// ============================================

/**
 * 後端 API 回應的商店資料結構
 * 對應後端 GET /api/stores/:id 回應格式
 */
interface StoreApiResponse {
  storeId: string;
  storeName: string;
  storeDescription: string;
  storeAddress: string;
  storeEmail: string;
  storePhone: string;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  storeAvatar?: string;
  productCount?: number;
}

/**
 * 取得商店詳情的 API 回應
 */
export interface GetStoreResponse {
  success: boolean;
  message?: string;
  store: Store;
}

// ============================================
// Mock 資料 (開發測試用 - 接入 API 後要刪除)
// ============================================

/**
 * Mock 商店資料庫
 * 模擬多個商店資料以測試不同情境
 */
const mockStores: Store[] = [
  {
    id: "store_001",
    name: "科技生活旗艦店",
    avatar: "https://i.pravatar.cc/150?img=10",
    productCount: 30,
    rating: 4.8,
    totalRatings: 150,
    joinDate: "2023/01",
    description: "專營3C電子產品、智能家居和配件。我們致力於提供高品質的商品和優質的客戶服務，所有商品均享有完善的售後保障。歡迎選購，我們將為您提供最優質的購物體驗！",
    address: "台北市大安區忠孝東路三段 100 號",
    email: "contact@techlife.com",
    phone: "02-2345-6789",
  },
  {
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
  {
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
];

// ============================================
// 輔助函數
// ============================================

/**
 * 模擬 API 延遲
 * @param ms - 延遲毫秒數，預設 800ms
 */
const mockDelay = (ms = 800): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 將後端 API 回應轉換為前端 Store 類型
 * 未來整合真實 API 時使用
 */
const mapApiResponseToStore = (apiData: StoreApiResponse): Store => {
  return {
    id: apiData.storeId,
    name: apiData.storeName,
    description: apiData.storeDescription,
    address: apiData.storeAddress,
    email: apiData.storeEmail,
    phone: apiData.storePhone,
    rating: apiData.averageRating,
    totalRatings: apiData.totalRatings,
    joinDate: new Date(apiData.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit' }).replace(/\//g, '/'),
    // 以下欄位後端可能未提供，需要預設值或另外取得
    avatar: apiData.storeAvatar || 'https://i.pravatar.cc/150?img=1',
    productCount: apiData.productCount || 0,
  };
};

// ============================================
// Service 函數
// ============================================

/**
 * 根據 ID 取得商店詳情 (Mock 版本)
 * @param storeId - 商店 ID
 * @returns 商店詳情回應
 * @throws {Error} 當商店不存在時拋出錯誤
 */
export const getStoreById = async (storeId: string): Promise<GetStoreResponse> => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // const response = await get<StoreApiResponse>(`/stores/${storeId}`);
  // const store = mapApiResponseToStore(response);
  // return { success: true, store };

  console.log('[Mock API] Get store by ID:', storeId);

  // 模擬網路延遲
  await mockDelay(800);

  // 查找商店
  const store = mockStores.find(s => s.id === storeId);

  if (!store) {
    throw new Error(`商店不存在 (ID: ${storeId})`); // TODO: i18n
  }

  return {
    success: true,
    message: '成功取得商店資訊',
    store,
  };
};

/**
 * 取得所有商店列表 (Mock 版本)
 * 未來可用於商店列表頁
 */
export const getAllStores = async (): Promise<Store[]> => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // return get<Store[]>('/stores');

  console.log('[Mock API] Get all stores');

  await mockDelay(600);

  return mockStores;
};

// ============================================
// 預設匯出
// ============================================

export default {
  getStoreById,
  getAllStores,
};
