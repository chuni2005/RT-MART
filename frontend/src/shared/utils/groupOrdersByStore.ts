import type { CartItem } from '@/types';
import type { StoreOrderGroup } from '@/types/order';

const SHIPPING_FEE = 60; // 基礎運費（之後也可從後端取得）

/**
 * 將購物車商品按商店分組並計算金額
 * 每個商店獨立計算運費
 * @param items 購物車商品列表
 * @param freeShippingThreshold 免運門檻（預設 500，可從後端取得）
 */
export const groupOrdersByStore = (
  items: CartItem[],
  freeShippingThreshold: number = 500
): StoreOrderGroup[] => {
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
        shipping: 0,         // 稍後計算
        shippingDiscount: 0, // 稍後計算
        total: 0,            // 稍後計算
      });
    }
  });

  // 計算每個商店的運費和總額
  const groups = Array.from(storeMap.values());
  groups.forEach((group) => {
    const isFreeShipping = group.subtotal >= freeShippingThreshold;
    group.shippingDiscount = isFreeShipping ? SHIPPING_FEE : 0; // 達標則折抵 60
    group.shipping = isFreeShipping ? 0 : SHIPPING_FEE;         // 實際運費
    group.total = group.subtotal + group.shipping;
  });

  return groups;
};