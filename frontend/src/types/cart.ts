import type { CartItem } from './common';

// Cart Page specific types

/**
 * StoreGroup is used for grouping cart items by store
 */
export interface StoreGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
  allSelected: boolean; // Computed property: whether all items in this store are selected
}