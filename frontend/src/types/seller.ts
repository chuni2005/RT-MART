import { OrderStatus } from "./order";

// ========== Sales Period ==========
export type SalesPeriod = "day" | "week" | "month";

// ========== Chart Type ==========
export type ChartType = "line" | "bar" | "pie";

// ========== Dashboard Types ==========
export interface DashboardData {
  revenue: number;
  orderCount: number;
  chartData: ChartDataPoint[]; // 折線圖數據（營業額趨勢）
  categoryData: ChartDataPoint[]; // 圓餅圖數據（類別銷售佔比）
  popularProducts: PopularProduct[];
  recentOrders: RecentOrder[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  image: string;
  salesCount: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

// ========== Store Types ==========
export interface StoreInfo {
  storeId?: string; // Store.store_id (bigint)
  sellerId?: string; // Store.seller_id (bigint)
  storeName: string; // Store.store_name
  storeDescription?: string; // Store.store_description
  storeAddress?: string; // Store.store_address
  storeEmail?: string; // Store.store_email
  storePhone?: string; // Store.store_phone

  // 評分統計
  totalStars?: number; // Store.total_stars (所有評價的星星總數)
  averageRating?: number; // Store.average_rating (快取欄位)
  totalReviews?: number; // Store.total_reviews (評價總次數)

  // Seller 相關欄位 (用於更新)
  bankAccountReference?: string; // Seller.bank_account_reference
  verified?: boolean; // Seller.verified
  verifiedAt?: string | null; // Seller.verified_at

  createdAt?: string; // Store.created_at
  updatedAt?: string; // Store.updated_at
}

// ========== Product Types ==========
export interface ProductImage {
  imageId?: string;              // ProductImage.image_id (bigint)
  imageUrl: string;              // ProductImage.image_url
  displayOrder: number;          // ProductImage.display_order
  file?: File;                   // 用於上傳的新檔案
}

export interface SellerProduct {
  productId: string; // Product.product_id (bigint)
  storeId: string; // Product.store_id (bigint)
  productTypeId: string; // Product.product_type_id (bigint)
  productName: string; // Product.product_name
  description?: string; // Product.description
  price: number; // Product.price (decimal 10,2)

  // 庫存資訊（來自 Inventory 表）
  stock: number; // Inventory.quantity (可用庫存)
  reserved?: number; // Inventory.reserved (預留庫存)

  // 統計資訊
  soldCount?: number;            // Product.sold_count (銷售數量)
  totalStars?: number;           // Product.total_stars (所有評價的星星總數)
  averageRating?: number;        // Product.average_rating (快取欄位)
  totalReviews?: number;         // Product.total_reviews (評價總次數)
  isActive: boolean;             // Product.is_active

  // 軟刪除標記
  deletedAt?: string | null; // Product.deleted_at

  images: ProductImage[]; // ProductImage[]
  createdAt: string; // Product.created_at
  updatedAt?: string; // Product.updated_at
}

export interface ProductFormData {
  productName: string;           // Product.product_name
  description: string;           // Product.description
  price: number;                 // Product.price
  productTypeId: string;         // Product.product_type_id (改為 productTypeId)
  stock: number;                 // Inventory.quantity (初始庫存)
  images: ProductImage[];        // ProductImage[] (包含 imageUrl 和 displayOrder)
  removedImageIds?: string[];    // 待刪除的圖片 ID 列表
}

// ========== Discount Types ==========
export interface Discount {
  discountId: string; // Discount.discount_id (bigint)
  discountCode: string; // Discount.discount_code
  discountType: "special"; // Discount.discount_type (Seller 只能建立 special)
  name: string; // Discount.name
  description?: string; // Discount.description
  minPurchaseAmount: number; // Discount.min_purchase_amount
  startDatetime: string; // Discount.start_datetime
  endDatetime: string; // Discount.end_datetime
  isActive: boolean; // Discount.is_active
  usageLimit?: number; // Discount.usage_limit
  usageCount: number; // Discount.usage_count

  // SpecialDiscount 相關欄位
  storeId: string; // SpecialDiscount.store_id
  productTypeId?: string | null; // SpecialDiscount.product_type_id (null = 全館)
  discountRate: number; // SpecialDiscount.discount_rate (0-1)
  maxDiscountAmount?: number; // SpecialDiscount.max_discount_amount

  createdAt?: string; // Discount.created_at
}

export interface DiscountFormData {
  discountCode: string; // Discount.discount_code
  name: string; // Discount.name
  description?: string; // Discount.description
  minPurchaseAmount: number; // Discount.min_purchase_amount
  startDatetime: string; // Discount.start_datetime
  endDatetime: string; // Discount.end_datetime
  usageLimit?: number; // Discount.usage_limit

  // SpecialDiscount 相關欄位
  productTypeId?: string | null; // SpecialDiscount.product_type_id (null = 全館)
  discountRate: number; // SpecialDiscount.discount_rate (0-1)
  maxDiscountAmount?: number; // SpecialDiscount.max_discount_amount
}

// ========== Seller Application Types ==========
export interface SellerApplicationForm {
  bank_account_reference: string;
}
