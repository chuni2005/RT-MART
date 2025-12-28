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
  useMemo,
  useRef,
} from "react";
import * as cartService from "../services/cartService";
import { CartItem } from "@/types";
import { useAuth } from "./AuthContext";
import { debounce } from "lodash-es";

interface CartContextValue {
  items: CartItem[];
  itemCount: number; // Badge 顯示的數量（商品種類數）
  totalAmount: number; // 購物車總額
  selectedTotalAmount: number; // 已勾選商品的總額
  isLoading: boolean;
  isInitialLoading: boolean;
  addToCart: (
    productId: string,
    quantity: number,
    selected?: boolean
  ) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateSelection: (itemId: string, selected: boolean) => Promise<void>;
  batchUpdateSelection: (
    updates: Array<{ cartItemId: string; selected: boolean }>
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  removeSelectedItems: () => Promise<void>;
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
  const [selectedTotalAmount, setSelectedTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 用於處理數量更新的防抖
  const pendingQuantities = useRef<Record<string, number>>({});

  /**
   * 刷新購物車資料
   * 使用輕量級的 summary API 來獲取數量，避免載入完整購物車資料
   */
  const refreshCart = useCallback(
    async (silent = false) => {
      // 未登入用戶不需要載入購物車
      if (!isAuthenticated) {
        setItems([]);
        setItemCount(0);
        setTotalAmount(0);
        setIsInitialLoading(false);
        return;
      }

      try {
        if (!silent) setIsLoading(true);

        const summary = await cartService.getCartSummary();
        if (summary.success) {
          setTotalAmount(summary.totalAmount);
          setSelectedTotalAmount(summary.selectedTotalAmount);

          // 獲取完整列表以計算商品種類數 (SKUs)
          const response = await cartService.getCartItems();
          if (response.success) {
            setItems(response.items);
            // 圖標 Badge 顯示的是商品種類數
            setItemCount(response.items.length);
          }
        }
      } catch (error) {
        console.error("Failed to load cart:", error);
        // On error, reset to empty state
        setItems([]);
        setItemCount(0);
        setTotalAmount(0);
        setSelectedTotalAmount(0);
      } finally {
        if (!silent) setIsLoading(false);
        setIsInitialLoading(false);
      }
    },
    [isAuthenticated]
  );

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
  const addToCart = async (
    productId: string,
    quantity: number,
    selected?: boolean
  ) => {
    try {
      setIsLoading(true);
      await cartService.addToCart(productId, quantity, selected);
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
    const previousItems = [...items];
    const previousItemCount = itemCount;

    // 樂觀更新
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setItemCount((prev) => prev - 1);

    try {
      await cartService.removeFromCart(itemId);
      // 靜默刷新以確保金額正確
      await refreshCart(true);
    } catch (error) {
      // 失敗回滾
      setItems(previousItems);
      setItemCount(previousItemCount);
      console.error("Failed to remove from cart:", error);
      throw error;
    }
  };

  /**
   * 同步數量到伺服器（防抖）
   */
  const debouncedSyncQuantity = useMemo(
    () =>
      debounce(async () => {
        const updates = { ...pendingQuantities.current };
        pendingQuantities.current = {}; // 清空待處理隊列

        try {
          // 逐一同步更新到後端
          for (const [itemId, quantity] of Object.entries(updates)) {
            await cartService.updateCartItem(itemId, { quantity });
          }
          // 同步成功後刷新，確保總額正確
          await refreshCart(true);
        } catch (error) {
          console.error("Failed to sync quantity:", error);
          // 失敗時強制刷新一次，讓 UI 回到伺服器狀態
          await refreshCart();
        }
      }, 500),
    [refreshCart]
  );

  /**
   * 組件卸載時清理防抖，防止記憶體洩漏
   */
  useEffect(() => {
    return () => {
      debouncedSyncQuantity.cancel();
    };
  }, [debouncedSyncQuantity]);

  /**
   * 更新購物車商品數量
   */
  const updateQuantity = async (itemId: string, quantity: number) => {
    // 1. 樂觀更新本地 UI
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );

    // 2. 紀錄待同步的數量
    pendingQuantities.current[itemId] = quantity;

    // 3. 觸發防抖同步
    debouncedSyncQuantity();
  };

  /**
   * 更新商品選取狀態
   */
  const updateSelection = async (itemId: string, selected: boolean) => {
    const previousItems = [...items];

    // 樂觀更新
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, selected } : item))
    );

    try {
      await cartService.updateCartItem(itemId, { selected });
      // 靜默刷新以確保金額正確
      await refreshCart(true);
    } catch (error) {
      // 失敗回滾
      setItems(previousItems);
      console.error("Failed to update selection:", error);
      throw error;
    }
  };

  /**
   * 批次更新商品選取狀態
   */
  const batchUpdateSelection = async (
    updates: Array<{ cartItemId: string; selected: boolean }>
  ) => {
    const previousItems = [...items];

    // 樂觀更新
    setItems((prev) =>
      prev.map((item) => {
        const update = updates.find((u) => u.cartItemId === item.id);
        return update ? { ...item, selected: update.selected } : item;
      })
    );

    try {
      await cartService.batchUpdateCartItems(updates);
      // 靜默刷新以確保金額正確
      await refreshCart(true);
    } catch (error) {
      // 失敗回滾
      setItems(previousItems);
      console.error("Failed to batch update selection:", error);
      throw error;
    }
  };

  /**
   * 清空購物車
   */
  const clearCart = async () => {
    const previousItems = [...items];
    const previousItemCount = itemCount;

    // 樂觀更新
    setItems([]);
    setItemCount(0);
    setTotalAmount(0);
    setSelectedTotalAmount(0);

    try {
      await cartService.clearCart();
      await refreshCart(true);
    } catch (error) {
      // 失敗回滾
      setItems(previousItems);
      setItemCount(previousItemCount);
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  /**
   * 移除已選取的項目
   */
  const removeSelectedItems = async () => {
    const previousItems = [...items];

    // 樂觀更新
    setItems((prev) => prev.filter((item) => !item.selected));

    try {
      await cartService.removeSelectedItems();
      await refreshCart(true);
    } catch (error) {
      // 失敗回滾
      setItems(previousItems);
      console.error("Failed to remove selected items:", error);
      throw error;
    }
  };

  const value: CartContextValue = {
    items,
    itemCount,
    totalAmount,
    selectedTotalAmount,
    isLoading,
    isInitialLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateSelection,
    batchUpdateSelection,
    clearCart,
    removeSelectedItems,
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
