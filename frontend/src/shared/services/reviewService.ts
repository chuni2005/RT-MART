/**
 * Review Service - API Integration
 */

import { get, post } from './api';
import type { Review, ReviewStatistics } from '@/types';

// ============================================
// 設定與環境變數
// ============================================

const USE_MOCK_API = (import.meta as any).env.VITE_USE_MOCK_API === 'true';

console.log(`[ReviewService] Current Mode: ${USE_MOCK_API ? 'MOCK' : 'REAL API'}`);

// ============================================
// 介面定義 (API Response Types)
// ============================================

/**
 * 取得評價列表的 API 回應
 */
export interface GetReviewsResponse {
  success: boolean;
  message?: string;
  reviews: Review[];
  total: number;
}

/**
 * 取得評價統計的 API 回應
 */
export interface GetReviewStatisticsResponse {
  success: boolean;
  message?: string;
  statistics: ReviewStatistics;
}

/**
 * 查詢評價的參數
 */
export interface GetReviewsParams {
  productId?: string | number;
  userId?: string;
  minRating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'createdAt';
  order?: 'asc' | 'desc';
}

/**
 * 後端 Review Entity 結構 (對應 backend/src/review/entities/review.entity.ts)
 */
interface BackendReview {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    userId: string;
    name: string;
    avatarUrl: string | null;
  };
  images: {
    imageUrl: string;
    displayOrder: number;
  }[];
}

// ============================================
// Mock 資料 (開發測試用 - 接入 API 後要刪除)
// ============================================

/**
 * Mock 評價資料
 */
const mockReviews: Review[] = [
  {
    id: 'review_001',
    productId: '1',
    userId: 'user_001',
    userName: '王小明',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    content: '商品品質非常好，音質清晰，降噪效果出色！戴了整天也不會覺得耳朵痛，非常推薦給需要長時間使用耳機的朋友。',
    images: [
      'https://picsum.photos/300/300?random=101',
      'https://picsum.photos/300/300?random=102',
    ],
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'review_002',
    productId: '1',
    userId: 'user_002',
    userName: '李美麗',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    rating: 4,
    content: '整體來說很滿意，連線穩定，電池續航力也不錯。唯一小缺點是充電盒有點大，不太好放口袋。',
    images: [],
    createdAt: '2023-12-05T14:30:00Z',
  },
  {
    id: 'review_003',
    productId: '1',
    userId: 'user_003',
    userName: '張大偉',
    userAvatar: null,
    rating: 5,
    content: '超值！這個價格買到這樣的品質真的很划算，降噪效果比預期的還要好。',
    images: [
      'https://picsum.photos/300/300?random=103',
    ],
    createdAt: '2023-12-10T09:15:00Z',
  },
  {
    id: 'review_004',
    productId: '2',
    userId: 'user_004',
    userName: '陳小華',
    userAvatar: 'https://i.pravatar.cc/150?img=8',
    rating: 5,
    content: '第二次購買了，送給家人用的。品質穩定，客服態度也很好！',
    images: [],
    createdAt: '2023-12-12T16:45:00Z',
  },
  {
    id: 'review_005',
    productId: '2',
    userId: 'user_005',
    userName: '林志玲',
    userAvatar: 'https://i.pravatar.cc/150?img=9',
    rating: 4,
    content: '音質不錯，配戴舒適，就是剛開始藍牙配對花了一點時間。',
    images: [],
    createdAt: '2023-12-15T11:20:00Z',
  },
  {
    id: 'review_006',
    productId: '3',
    userId: 'user_006',
    userName: '吳宗翰',
    userAvatar: 'https://i.pravatar.cc/150?img=12',
    rating: 3,
    content: '商品是不錯，但包裝有點簡陋，希望能加強一下。',
    images: [],
    createdAt: '2023-12-18T13:10:00Z',
  },
  {
    id: 'review_007',
    productId: '1',
    userId: 'user_007',
    userName: '黃小婷',
    userAvatar: 'https://i.pravatar.cc/150?img=16',
    rating: 5,
    content: '非常滿意！降噪效果一級棒，通勤時用超讚的。',
    images: [
      'https://picsum.photos/300/300?random=104',
      'https://picsum.photos/300/300?random=105',
      'https://picsum.photos/300/300?random=106',
    ],
    createdAt: '2023-12-20T10:05:00Z',
  },
  {
    id: 'review_008',
    productId: '1',
    userId: 'user_008',
    userName: '周杰倫',
    userAvatar: 'https://i.pravatar.cc/150?img=18',
    rating: 5,
    content: '音質真的很好，推薦給喜歡聽音樂的朋友！',
    images: [],
    createdAt: '2023-12-22T15:30:00Z',
  },
];

/**
 * Mock 評價統計資料
 */
const mockStatistics: ReviewStatistics = {
  average: 4.5,
  total: 150,
  distribution: {
    5: 98,
    4: 32,
    3: 12,
    2: 5,
    1: 3,
  },
};

// ============================================
// 輔助函數
// ============================================

/**
 * 模擬 API 延遲
 * @param ms - 延遲毫秒數，預設 500ms
 */
const mockDelay = (ms = 500): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 將後端 Review Entity 轉換為前端 Review 介面
 */
const transformReview = (backendReview: BackendReview): Review => {
  return {
    id: backendReview.reviewId,
    productId: backendReview.productId,
    userId: backendReview.userId,
    userName: backendReview.user?.name || '未知用戶',
    userAvatar: backendReview.user?.avatarUrl,
    rating: backendReview.rating,
    content: backendReview.comment,
    images: (backendReview.images || [])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(img => img.imageUrl),
    createdAt: backendReview.createdAt,
  };
};

// ============================================
// Service 函數
// ============================================

/**
 * 根據商品 ID 取得評價列表
 * @param productId - 商品 ID
 * @param params - 查詢參數
 * @returns 評價列表回應
 */
export const getReviewsByProductId = async (
  productId: string | number,
  params: Omit<GetReviewsParams, 'productId'> = {}
): Promise<GetReviewsResponse> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      const queryParams = new URLSearchParams({
        ...params,
        productId: String(productId)
      } as any).toString();
      
      const response = await get<GetReviewsResponse>(`/review?${queryParams}`);
      
      // 注意：後端回傳的可能是 BackendReview[]，需要轉換
      return {
        ...response,
        reviews: (response.reviews as any).map(transformReview)
      };
    } catch (error) {
      console.error('[API Error] getReviewsByProductId:', error);
      throw error;
    }
  }

  // Mock Mode
  console.log('[Mock API] Get reviews for product:', productId, params);
  await mockDelay(400);

  let filteredReviews = mockReviews.filter(r => String(r.productId) === String(productId));

  if (params.minRating !== undefined && params.minRating !== null) {
    filteredReviews = filteredReviews.filter(r => r.rating >= params.minRating!);
  }

  if (params.sortBy) {
    filteredReviews.sort((a, b) => {
      const order = params.order === 'desc' ? -1 : 1;
      switch (params.sortBy) {
        case 'rating':
          return (a.rating - b.rating) * order;
        default:
          return 0;
      }
    });
  }

  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  return {
    success: true,
    message: '成功取得評價列表 (Mock)',
    reviews: paginatedReviews,
    total: filteredReviews.length,
  };
};

/**
 * 根據商品 ID 取得評價統計
 * @param productId - 商品 ID
 * @returns 評價統計回應
 */
export const getReviewStatistics = async (
  productId: string | number
): Promise<GetReviewStatisticsResponse> => {
  // Real API Mode
  if (!USE_MOCK_API) {
    try {
      return await get<GetReviewStatisticsResponse>(`/review/statistics/${productId}`);
    } catch (error) {
      console.error('[API Error] getReviewStatistics:', error);
      throw error;
    }
  }

  // Mock Mode
  console.log('[Mock API] Get review statistics for product:', productId);
  await mockDelay(300);

  return {
    success: true,
    message: '成功取得評價統計 (Mock)',
    statistics: mockStatistics,
  };
};

/**
 * 提交評價
 * @param data - 評價數據與圖片
 */
export const createReview = async (formData: FormData): Promise<{ success: boolean; message: string }> => {
  if (!USE_MOCK_API) {
    try {
      await post('/review', formData);
      return { success: true, message: '評價提交成功' };
    } catch (error) {
      console.error('[API Error] createReview:', error);
      throw error;
    }
  }

  // Mock Mode
  console.log('[Mock API] Create review');
  await mockDelay(1000);
  return { success: true, message: '評價提交成功 (Mock)' };
};

// ============================================
// 預設匯出
// ============================================

export default {
  getReviewsByProductId,
  getReviewStatistics,
  createReview,
};
