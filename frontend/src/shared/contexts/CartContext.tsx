/**
 * CartContext - 全域購物車狀態管理
 * 提供購物車商品數量、新增、刪除、更新等功能
 * 使用觀察者模式自動同步購物車狀態到 Header badge
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import * as cartService from "../services/cartService";
import { CartItem } from "@/types";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  items: CartItem[];
  itemCount: number; // Badge 顯示的數量（商品種類數）
  totalAmount: number; // 購物車總額
  isLoading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 刷新購物車資料
   * 使用輕量級的 summary API 來獲取數量，避免載入完整購物車資料
   */
  const refreshCart = useCallback(async () => {
    // 未登入用戶不需要載入購物車
    if (!isAuthenticated) {
      setItems([]);
      setItemCount(0);
      setTotalAmount(0);
      return;
    }

    try {
      setIsLoading(true);

      // TODO: When real API is ready, uncomment this:
      /*
      const summary = await cartService.getCartSummary();
      if (summary.success) {
        setItemCount(summary.totalItems);
        setTotalAmount(summary.totalAmount);
      }
      */

      // Mock implementation: fetch full cart data
      const response = await cartService.getCartItems();
      if (response.success) {
        setItems(response.items);
        // Calculate item count (number of unique items)
        const count = response.items.length;
        const amount = response.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        setItemCount(count);
        setTotalAmount(amount);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      // On error, reset to empty state
      setItems([]);
      setItemCount(0);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * 初始化：用戶登入後自動載入購物車
   */
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  /**
   * 新增商品到購物車
   * 新增後自動刷新購物車狀態（觀察者模式）
   */
  const addToCart = async (productId: string, quantity: number) => {
    try {
      setIsLoading(true);

      // TODO: When real API is ready, the backend will handle the add operation
      // Real API: POST /api/v1/carts/items
      await cartService.addToCart(productId, quantity);

      // Auto-refresh cart after adding
      await refreshCart();
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 從購物車移除商品
   */
  const removeFromCart = async (itemId: string) => {
    try {
      setIsLoading(true);

      // TODO: When real API is ready
      // Real API: DELETE /api/v1/carts/items/:cartItemId
      await cartService.removeFromCart(itemId);

      // Auto-refresh cart after removing
      await refreshCart();
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 更新購物車商品數量
   */
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);

      // TODO: When real API is ready
      // Real API: PATCH /api/v1/carts/items/:cartItemId
      await cartService.updateCartItemQuantity(itemId, quantity);

      // Auto-refresh cart after updating
      await refreshCart();
    } catch (error) {
      console.error("Failed to update cart item:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清空購物車
   */
  const clearCart = async () => {
    try {
      setIsLoading(true);

      // TODO: When real API is ready
      // Real API: DELETE /api/v1/carts
      await cartService.clearCart();

      // Auto-refresh (will be empty)
      await refreshCart();
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: CartContextValue = {
    items,
    itemCount,
    totalAmount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * useCart Hook - 方便取用 CartContext
 */
export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};

export default CartContext;
