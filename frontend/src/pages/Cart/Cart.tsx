import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.scss';
import ItemListCard from '@/shared/components/ItemListCard';
import CheckoutSummary from './components/CheckoutSummary';
import EmptyState from '@/shared/components/EmptyState';
import StoreGroupHeader from '@/shared/components/StoreGroupHeader';
import type { CartItem } from '@/types';
import type { StoreGroup } from '@/types/cart';
import {
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  toggleCartItemSelection,
  selectAllCartItems,
  selectStoreItems,
} from '@/shared/services/cartService';

/**
 * Group cart items by store
 */
const groupItemsByStore = (items: CartItem[]): StoreGroup[] => {
  const storeMap = new Map<string, StoreGroup>();

  items.forEach((item) => {
    const existing = storeMap.get(item.storeId);

    if (existing) {
      existing.items.push(item);
    } else {
      storeMap.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [item],
        allSelected: false,
      });
    }
  });

  // Calculate allSelected status for each store group
  const groups = Array.from(storeMap.values());
  groups.forEach((group) => {
    group.allSelected =
      group.items.length > 0 && group.items.every((item) => item.selected);
  });

  return groups;
};

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Group items by store
  const storeGroups = useMemo(() => groupItemsByStore(cartItems), [cartItems]);

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

  // 計算運費（滿 500 免運）TODO: 改為管理員設定
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

  // Handle store-level selection
  const handleSelectStore = async (storeId: string, selected: boolean) => {
    try {
      await selectStoreItems(storeId, selected);
      setCartItems((prev) =>
        prev.map((item) =>
          item.storeId === storeId ? { ...item, selected } : item
        )
      );
    } catch (error) {
      console.error('Failed to select store items:', error);
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

  // 空購物車狀態
  if (cartItems.length === 0) {
    return <EmptyState type="cart" />;
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
            {/* Checkbox Area */}
            <div className={styles.checkboxArea}>
              <input
                type="checkbox"
                id="selectAll"
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </div>

            {/* Image Placeholder with Product Label */}
            <div className={styles.imagePlaceholder}>
              <span>商品 ({selectedItems.length}/{cartItems.length})</span>
            </div>

            {/* Column Headers matching productInfo grid */}
            <div className={styles.columnHeaders}>
              <span className={styles.unitPrice}>單價</span>
              <span className={styles.quantity}>數量</span>
              <span className={styles.subtotal}>小計</span>
            </div>

            {/* Delete Button Placeholder */}
            <div className={styles.deletePlaceholder}></div>
          </div>

          {/* 購物車項目列表 */}
          <div className={styles.cartItems}>
            {storeGroups.map((storeGroup) => (
              <div key={storeGroup.storeId} className={styles.storeGroup}>
                {/* Store Header */}
                <StoreGroupHeader
                  storeId={storeGroup.storeId}
                  storeName={storeGroup.storeName}
                  allSelected={storeGroup.allSelected}
                  onSelectAll={(selected) =>
                    handleSelectStore(storeGroup.storeId, selected)
                  }
                />

                {/* Store Items */}
                <div className={styles.storeItems}>
                  {storeGroup.items.map((item, index) => {
                    const isLast = index === storeGroup.items.length - 1;

                    const itemClassName = isLast
                          ? styles.lastItem
                          : '';

                    return (
                      <ItemListCard
                        key={item.id}
                        variant="cart"
                        item={item}
                        selectable
                        editable
                        deletable
                        className={itemClassName}
                        onSelect={(selected) => handleSelectItem(item.id, selected)}
                        onQuantityChange={(qty) =>
                          handleQuantityChange(item.id, qty)
                        }
                        onDelete={() => handleDelete(item.id)}
                        onClick={() => navigate(`/product/${item.productId}`)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：結帳摘要 */}
        <CheckoutSummary
          subtotal={subtotal}
          shipping={shipping}
          discount={0}
          total={total}
          itemCount={cartItems.length}
          selectedCount={selectedItems.length}
          freeShippingThreshold={500}
          onCheckout={handleCheckout}
          disabled={selectedItems.length === 0}
        />
      </div>
    </div>
  );
}

export default Cart;
