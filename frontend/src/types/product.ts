// Store related types
export interface Store {
  id: string;
  name: string;
  avatar: string;
  productCount: number;
  rating: number;
  joinDate: string;
}

// Product related types
export interface Product {
  id: number;
  name: string;
  currentPrice: number;
  originalPrice: number | null;
  description: string;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  images: string[];
  store: Store;
}
