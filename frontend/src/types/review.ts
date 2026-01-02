// Review related types
export interface Review {
  id: string;
  productId: string; // 關聯商品
  userId: string;            // 關聯用戶
  userName: string;          // 顯示用
  userAvatar: string | null; // 顯示用
  rating: number;            // 1-5
  content: string;
  images: string[];          // 圖片陣列
  createdAt: string;         // 建立時間
}

export interface ReviewStatistics {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
