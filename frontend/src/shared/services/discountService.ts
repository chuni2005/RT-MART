import { get } from './api';
import type { DiscountRecommendation } from '@/types/order';

export const getRecommendedDiscounts = async (
  subtotal: number,
  storeIds: string[]
): Promise<DiscountRecommendation> => {
  const queryParams = new URLSearchParams({
    subtotal: subtotal.toString(),
    storeIds: storeIds.join(','),
  });

  return await get<DiscountRecommendation>(`/discounts/recommended?${queryParams}`);
};
