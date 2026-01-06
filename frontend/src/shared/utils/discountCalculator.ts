import type {
  ManualDiscountSelection,
  AvailableDiscount,
  DiscountSelections,
} from "@/types/order";

/**
 * 根據用戶選擇的折扣碼計算實際折扣金額
 * 會自動套用最優惠的商家折扣 (SpecialDiscount)
 * @param selections - 用戶選擇的折扣碼 { shipping, product }
 * @param allDiscounts - 所有可用的折扣列表
 * @param subtotal - 訂單小計金額
 * @returns 計算後的折扣詳情
 */
export const calculateDiscountAmounts = (
  selections: DiscountSelections,
  allDiscounts: AvailableDiscount[],
  subtotal: number
): ManualDiscountSelection => {
  const result: ManualDiscountSelection = {
    shipping: null,
    seasonal: null,
    special: null,
  };

  // 1. 處理商家折扣 (SpecialDiscount) - 自動套用
  // 找出所有類型的 SpecialDiscount
  const specialDiscounts = allDiscounts.filter(
    (d) => d.discountType === "special" && d.specialDiscount
  );

  if (specialDiscounts.length > 0) {
    // 找出最優惠的一個（簡化處理：對整個小計套用。後端會根據商品分類精確計算）
    let bestSpecial = null;
    let maxSpecialAmount = 0;

    for (const d of specialDiscounts) {
      if (subtotal >= d.minPurchaseAmount) {
        const rate = d.specialDiscount!.discountRate;
        const max = d.specialDiscount!.maxDiscountAmount || Infinity;
        const amount = Math.floor(Math.min(subtotal * rate, max));

        if (amount > maxSpecialAmount) {
          maxSpecialAmount = amount;
          bestSpecial = d;
        }
      }
    }

    if (bestSpecial) {
      result.special = {
        code: bestSpecial.discountCode,
        name: bestSpecial.name,
        amount: maxSpecialAmount,
      };
    }
  }

  // 2. 處理運費折扣 (ShippingDiscount) - 用戶選擇
  if (selections.shipping) {
    const shippingDiscount = allDiscounts.find(
      (d) =>
        d.discountCode === selections.shipping && d.discountType === "shipping"
    );
    if (shippingDiscount?.shippingDiscount) {
      if (subtotal >= shippingDiscount.minPurchaseAmount) {
        result.shipping = {
          code: shippingDiscount.discountCode,
          name: shippingDiscount.name,
          amount: Math.floor(shippingDiscount.shippingDiscount.discountAmount),
        };
      }
    }
  }

  // 3. 處理商品折扣 (SeasonalDiscount) - 用戶選擇
  if (selections.product) {
    const productDiscount = allDiscounts.find(
      (d) =>
        d.discountCode === selections.product && d.discountType === "seasonal"
    );

    if (productDiscount?.seasonalDiscount) {
      if (subtotal >= productDiscount.minPurchaseAmount) {
        const rate = productDiscount.seasonalDiscount.discountRate;
        const max = productDiscount.seasonalDiscount.maxDiscountAmount || Infinity;
        const amount = Math.floor(Math.min(subtotal * rate, max));

        result.seasonal = {
          code: productDiscount.discountCode,
          name: productDiscount.name,
          amount,
        };
      }
    }
  }

  return result;
};
