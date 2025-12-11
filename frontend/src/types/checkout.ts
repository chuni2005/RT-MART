// Checkout page specific types

import type { StoreOrderGroup } from '@/types/order';

/**
 * StoreOrderSection 組件 Props
 * 用於顯示單個商店的訂單區塊
 */
export interface StoreOrderSectionProps {
  storeGroup: StoreOrderGroup;
  note: string;
  onNoteChange: (storeId: string, note: string) => void;
}
