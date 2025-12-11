import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.scss';
import ItemListCard from '@/shared/components/ItemListCard';
import CheckoutSummary from '@/shared/components/CheckoutSummary';
import EmptyState from '@/shared/components/EmptyState';
import StoreGroupHeader from '@/shared/components/StoreGroupHeader';
import Dialog from '@/shared/components/Dialog';
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
import { groupOrdersByStore } from '@/shared/utils/groupOrdersByStore';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Group items by store
  const storeGroups = useMemo(() => groupItemsByStore(cartItems), [cartItems]);

  // 計算選取的項目
  const selectedItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems]
  );

  // 按商店分組計算運費（每個商店獨立計算滿 500 免運）
  // TODO: 改為管理員設定
  const { subtotal, shipping, shippingDiscount, total } = useMemo(() => {
    const storeGroups = groupOrdersByStore(selectedItems);

    return {
      subtotal: storeGroups.reduce((sum, group) => sum + group.subtotal, 0),
      shipping: storeGroups.reduce((sum, group) => sum + group.shipping, 0),
      shippingDiscount: storeGroups.reduce((sum, group) => sum + group.shippingDiscount, 0),
      total: storeGroups.reduce((sum, group) => sum + group.total, 0),
    };
  }, [selectedItems]);

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
  const handleDelete = (id: string) => {
    setDeleteItemId(id);
    setShowDeleteDialog(true);
  };

  // 確認刪除
  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await removeFromCart(deleteItemId);
      setCartItems((prev) => prev.filter((item) => item.id !== deleteItemId));
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeleteItemId(null);
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
          shippingDiscount={shippingDiscount}
          discount={0}
          total={total}
          itemCount={cartItems.length}
          selectedCount={selectedItems.length}
          freeShippingThreshold={500}
          onCheckout={handleCheckout}
          disabled={selectedItems.length === 0}
        />
      </div>

      {/* 刪除確認對話框 */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        type="confirm"
        variant="danger"
        title="刪除商品"
        message="確定要將此商品從購物車移除嗎？"
        confirmText="刪除"
        cancelText="取消"
        onConfirm={confirmDelete}
        mediaUrl="/CryingEmoji.gif"
      />
    </div>
  );
}

export default Cart;
