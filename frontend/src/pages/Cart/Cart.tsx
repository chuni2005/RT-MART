import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.scss';
import ItemListCard from '@/shared/components/ItemListCard';
import Button from '@/shared/components/Button';
import type { CartItem } from '@/types';
import {
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  toggleCartItemSelection,
  selectAllCartItems,
} from '@/shared/services/cartService';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 計算選取的項目
  const selectedItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems]
  );

  // 計算小計
  const subtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  );

  // 計算運費（滿 500 免運）
  const shipping = subtotal >= 500 ? 0 : 60;

  // 總計
  const total = subtotal + shipping;

  // 全選狀態
  const allSelected =
    cartItems.length > 0 && cartItems.every((item) => item.selected);

  // 載入購物車數據
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const response = await getCartItems();
        setCartItems(response.items);
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, []);

  // 全選/取消全選
  const handleSelectAll = async () => {
    try {
      await selectAllCartItems(!allSelected);
      setCartItems((prev) =>
        prev.map((item) => ({ ...item, selected: !allSelected }))
      );
    } catch (error) {
      console.error('Failed to select all:', error);
    }
  };

  // 切換單個項目選取
  const handleSelectItem = async (id: string, selected: boolean) => {
    try {
      await toggleCartItemSelection(id, selected);
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, selected } : item))
      );
    } catch (error) {
      console.error('Failed to toggle selection:', error);
    }
  };

  // 更新數量
  const handleQuantityChange = async (id: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      await updateCartItemQuantity(id, quantity);
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : '更新失敗');
    }
  };

  // 刪除項目
  const handleDelete = async (id: string) => {
    // TODO: 替換為 Dialog 組件
    if (!confirm('確定要刪除此商品嗎？')) return;

    try {
      await removeFromCart(id);
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  // 前往結帳
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('請至少選擇一個商品');
      return;
    }
    // TODO: 實作結帳頁面
    navigate('/checkout', {
      state: { items: selectedItems },
    });
  };

  // Loading 狀態
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.pageHeader}>
        <h1>購物車</h1>
        <span className={styles.itemCount}>共 {cartItems.length} 件商品</span>
      </div>

      <div className={styles.cartContainer}>
        {/* 左側：購物車內容 */}
        <div className={styles.cartContent}>
          {/* 全選控制 */}
          <div className={styles.selectAllSection}>
            <input
              type="checkbox"
              id="selectAll"
              checked={allSelected}
              onChange={handleSelectAll}
            />
            <label htmlFor="selectAll">
              全選 ({selectedItems.length}/{cartItems.length})
            </label>
          </div>

          {/* 購物車項目列表 */}
          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <ItemListCard
                key={item.id}
                variant="cart"
                item={item}
                selectable
                editable
                deletable
                onSelect={(selected) => handleSelectItem(item.id, selected)}
                onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                onDelete={() => handleDelete(item.id)}
                onClick={() => navigate(`/product/${item.productId}`)}
              />
            ))}
          </div>
        </div>

        {/* TODO：右側結帳摘要 */}
        
      </div>
    </div>
  );
}

export default Cart;
