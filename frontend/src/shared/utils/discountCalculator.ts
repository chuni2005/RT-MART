import type {
  ManualDiscountSelection,
  AvailableDiscount,
  DiscountSelections,
} from "@/types/order";

/**
 * 根據用戶選擇的折扣碼計算實際折扣金額
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

  // 處理運費折扣
  if (selections.shipping) {
    const shippingDiscount = allDiscounts.find(
      (d) =>
        d.discountCode === selections.shipping && d.discountType === "shipping"
    );
    if (shippingDiscount?.shippingDiscount) {
      result.shipping = {
        code: shippingDiscount.discountCode,
        name: shippingDiscount.name,
        amount: Math.floor(shippingDiscount.shippingDiscount.discountAmount),
      };
    }
  }

  // 處理商品折扣
  if (selections.product) {
    const productDiscount = allDiscounts.find(
      (d) =>
        d.discountCode === selections.product &&
        (d.discountType === "seasonal" || d.discountType === "special")
    );

    if (productDiscount) {
      let amount = 0;

      if (
        productDiscount.discountType === "seasonal" &&
        productDiscount.seasonalDiscount
      ) {
        const rate = productDiscount.seasonalDiscount.discountRate;
        const max =
          productDiscount.seasonalDiscount.maxDiscountAmount || Infinity;
        amount = Math.floor(Math.min(subtotal * rate, max));

        result.seasonal = {
          code: productDiscount.discountCode,
          name: productDiscount.name,
          amount,
        };
      } else if (
        productDiscount.discountType === "special" &&
        productDiscount.specialDiscount
      ) {
        const rate = productDiscount.specialDiscount.discountRate;
        const max =
          productDiscount.specialDiscount.maxDiscountAmount || Infinity;
        amount = Math.floor(Math.min(subtotal * rate, max));

        result.special = {
          code: productDiscount.discountCode,
          name: productDiscount.name,
          amount,
        };
      }
    }
  }

  return result;
};
