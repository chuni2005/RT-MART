import { useState } from "react";
import styles from "./CheckoutSummary.module.scss";
import Button from "@/shared/components/Button";
import type { CheckoutSummaryCheckoutModeProps } from "@/types";

type Props = CheckoutSummaryCheckoutModeProps;

// 折扣項目組件
interface DiscountItemProps {
  type: 'shipping' | 'seasonal' | 'special';
  discount: { code: string; name: string; amount: number };
}

function DiscountItem({ type, discount }: DiscountItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const typeLabels = {
    shipping: '運費折扣',
    seasonal: '季節折扣',
    special: '特別活動折扣',
  };

  return (
    <div
      className={styles.discountItem}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={styles.type}>{typeLabels[type]}</span>
      <span className={styles.amount}>-${discount.amount}</span>

      {showTooltip && (
        <div className={styles.tooltip}>
          <div><strong>{discount.code}</strong></div>
          <div>{discount.name}</div>
          <div className={styles.tooltipAmount}>折扣 ${discount.amount}</div>
        </div>
      )}
    </div>
  );
}

function CheckoutSummary(props: Props) {
  const {
    storeGroups,
    selectedCount,
    appliedDiscounts,
    onCheckout,
    onDiscountChange,
    disabled = false,
    buttonText = "前往結帳"
  } = props;

  const totalItems = storeGroups.reduce((sum, g) => sum + g.items.length, 0);
  const subtotalAll = storeGroups.reduce((sum, g) => sum + g.subtotal, 0);

  // 計算基礎運費總額（每店 60）
  const baseShippingFee = storeGroups.length * 60;

  // 計算折扣金額（使用 Math.floor 無條件捨去）
  const shippingDiscountAmount = appliedDiscounts?.shipping?.amount
    ? Math.floor(appliedDiscounts.shipping.amount)
    : 0;
  const seasonalDiscountAmount = appliedDiscounts?.seasonal?.amount
    ? Math.floor(appliedDiscounts.seasonal.amount)
    : 0;
  const specialDiscountAmount = appliedDiscounts?.special?.amount
    ? Math.floor(appliedDiscounts.special.amount)
    : 0;

  const totalDiscount =
    shippingDiscountAmount + seasonalDiscountAmount + specialDiscountAmount;

  // 計算最終總額（含優惠）
  const grandTotal = subtotalAll + baseShippingFee - totalDiscount;

  // 判斷是否有折扣
  const hasDiscount = appliedDiscounts?.shipping || appliedDiscounts?.seasonal || appliedDiscounts?.special;

  return (
    <div className={styles.checkoutSummary}>
      <h3>結帳資訊</h3>

      {/* 商品折扣區塊 */}
      <div className={styles.discountBlock}>
        <div className={styles.discountHeader}>
          <h4>商品折扣</h4>
          {onDiscountChange && (
            <Button variant="ghost" size="sm" onClick={onDiscountChange}>
              變更
            </Button>
          )}
        </div>

        <div className={styles.discountsList}>
          {appliedDiscounts?.shipping && (
            <DiscountItem type="shipping" discount={appliedDiscounts.shipping} />
          )}
          {appliedDiscounts?.seasonal && (
            <DiscountItem type="seasonal" discount={appliedDiscounts.seasonal} />
          )}
          {appliedDiscounts?.special && (
            <DiscountItem type="special" discount={appliedDiscounts.special} />
          )}

          {!hasDiscount && (
            <p className={styles.noDiscount}>目前未套用任何折扣</p>
          )}
        </div>
      </div>

      {/* 價格明細 */}
      <div className={styles.priceBreakdown}>
        <div className={styles.row}>
          <span>商品總額</span>
          <span>$ {subtotalAll}</span>
        </div>
        <div className={styles.row}>
          <span>運費總額</span>
          <span>$ {baseShippingFee}</span>
        </div>

        {/* 分開顯示不同類型的折扣 */}
        {seasonalDiscountAmount > 0 && (
          <div className={styles.row}>
            <span>季節折扣</span>
            <span className={styles.discount}>-$ {seasonalDiscountAmount}</span>
          </div>
        )}
        {specialDiscountAmount > 0 && (
          <div className={styles.row}>
            <span>特別活動折扣</span>
            <span className={styles.discount}>-$ {specialDiscountAmount}</span>
          </div>
        )}
        {shippingDiscountAmount > 0 && (
          <div className={styles.row}>
            <span>運費折扣</span>
            <span className={styles.discount}>-$ {shippingDiscountAmount}</span>
          </div>
        )}

        <div className={styles.divider} />
        <div className={`${styles.row} ${styles.total}`}>
          <span>應付總額</span>
          <span className={styles.totalAmount}>$ {grandTotal}</span>
        </div>
      </div>

      {/* 商品數量 */}
      <div className={styles.selectedInfo}>
        {selectedCount !== undefined
          ? `已選取 ${totalItems} / ${selectedCount} 項商品`
          : `共 ${totalItems} 項商品`}
      </div>

      {/* 結帳按鈕 */}
      <Button
        variant="primary"
        fullWidth
        onClick={onCheckout}
        disabled={disabled}
        className={styles.checkoutBtn}
      >
        {buttonText} ({selectedCount !== undefined ? selectedCount : storeGroups.length} {selectedCount !== undefined ? '' : '筆訂單'})
      </Button>
    </div>
  );
}

export default CheckoutSummary;
