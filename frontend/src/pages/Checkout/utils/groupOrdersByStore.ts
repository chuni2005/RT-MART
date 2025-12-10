import type { CartItem } from '@/types';
import type { StoreOrderGroup } from '@/types/order';

/**
 * 將購物車商品按商店分組並計算金額
 * 類似 Cart.tsx 的 groupItemsByStore，但增加金額計算
 */
export const groupOrdersByStore = (items: CartItem[]): StoreOrderGroup[] => {
  const storeMap = new Map<string, StoreOrderGroup>();

  items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    const existing = storeMap.get(item.storeId);

    if (existing) {
      existing.items.push(item);
      existing.subtotal += itemTotal;
    } else {
      storeMap.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [item],
        subtotal: itemTotal,
        shipping: 0, // 稍後計算
        total: 0, // 稍後計算
      });
    }
  });

  // 計算每個商店的運費和總額（滿 500 免運）
  const groups = Array.from(storeMap.values());
  groups.forEach((group) => {
    group.shipping = group.subtotal >= 500 ? 0 : 60;
    group.total = group.subtotal + group.shipping;
  });

  return groups;
};
