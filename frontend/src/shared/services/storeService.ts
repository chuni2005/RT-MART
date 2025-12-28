/**
 * Store Service - API Integration
 */

import { get } from './api';
import type { Store } from '@/types';

// ============================================
// 設定與環境變數
// ============================================

const USE_MOCK_API = (import.meta as any).env.VITE_USE_MOCK_API === 'true';

console.log(`[StoreService] Current Mode: ${USE_MOCK_API ? 'MOCK' : 'REAL API'}`);

// ============================================
// 介面定義 (Backend API Response Types)
// ============================================

/**
 * 後端 Store Entity 結構 (對應 backend/src/stores/entities/store.entity.ts)
 */
interface BackendStore {
  storeId: string;
  sellerId: string;
  storeName: string;
  storeDescription: string | null;
  storeAddress: string | null;
  storeEmail: string | null;
  storePhone: string | null;
  avatar: string | null;
  averageRating: string; // Decimal is often returned as string
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  productCount?: number;
}

/**
 * 後端列表 API 回應結構
 */
interface BackendStoreListResponse {
  data: BackendStore[];
  total: number;
  page: number;
  limit: number;
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
 * 將後端 Store Entity 轉換為前端 Store 介面
 */
const transformStore = (backendStore: BackendStore): Store => {
  return {
    id: backendStore.storeId,
    name: backendStore.storeName,
    description: backendStore.storeDescription || '',
    address: backendStore.storeAddress || '',
    email: backendStore.storeEmail || '',
    phone: backendStore.storePhone || '',
    rating: Number(backendStore.averageRating) || 0,
    totalRatings: backendStore.totalRatings || 0,
    // 格式化日期
    joinDate: new Date(backendStore.createdAt).toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit' 
    }).replace(/\//g, '/'),
    // 處理 Avatar 空值
    avatar: backendStore.avatar || 'https://i.pravatar.cc/150?img=1',
    // 處理 Product Count
    productCount: backendStore.productCount || 0, 
  };
};

// ============================================
// Service 函數
// ============================================

/**
 * 根據 ID 取得商店詳情
 */
export const getStoreById = async (storeId: string): Promise<GetStoreResponse> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      // 直接呼叫後端標準 CRUD 端點
      const backendStore = await get<BackendStore>(`/stores/${storeId}`);
      
      return {
        success: true,
        message: '成功取得商店資訊',
        store: transformStore(backendStore),
      };
    } catch (error) {
      console.error('[API Error] getStoreById:', error);
      throw error;
    }
  }

  // Mock Mode
  console.log('[Mock API] Get store by ID:', storeId);
  await mockDelay(800);
  const store = mockStores.find(s => s.id === storeId);
  if (!store) throw new Error(`商店不存在 (ID: ${storeId})`);
  return { success: true, message: '成功取得商店資訊', store };
};

/**
 * 取得所有商店列表
 */
export const getAllStores = async (): Promise<Store[]> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      // 後端回傳分頁格式 { data, total }，這裡我們只取 data
      // 注意：這裡可能需要考慮是否要傳入分頁參數，目前先取預設 (page=1, limit=100)
      const response = await get<BackendStoreListResponse>('/stores?limit=100'); 
      return response.data.map(transformStore);
    } catch (error) {
      console.error('[API Error] getAllStores:', error);
      // 發生錯誤時回傳空陣列或拋出錯誤，視 UX 決定
      return []; 
    }
  }

  // Mock Mode
  console.log('[Mock API] Get all stores');
  await mockDelay(600);
  return mockStores;
};

export default {
  getStoreById,
  getAllStores,
};
