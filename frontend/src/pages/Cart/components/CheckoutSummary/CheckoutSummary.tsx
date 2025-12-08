import styles from "./CheckoutSummary.module.scss";
import Button from "@/shared/components/Button";
import type { CheckoutSummaryProps } from "@/types";

function CheckoutSummary({
  subtotal,
  shipping,
  discount,
  total,
  itemCount,
  selectedCount,
  freeShippingThreshold = 500,
  onCheckout,
  disabled,
}: CheckoutSummaryProps) {
  return (
    <div className={styles.checkoutSummary}>
      <h3>結帳資訊</h3>

      {/* 免運提示 */}
      {subtotal < freeShippingThreshold && (
        <div className={styles.freeShippingHint}>
          再買 $ {freeShippingThreshold - subtotal} 即可免運
        </div>
      )}

      {/* 價格明細 */}
      <div className={styles.priceBreakdown}>
        <div className={styles.row}>
          <span>商品總額</span>
          <span>$ {subtotal}</span>
        </div>
        <div className={styles.row}>
          <span>運費</span>
          <span className={shipping === 0 ? styles.free : ""}>
            {shipping === 0 ? "免運" : `$ ${shipping}`}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.row} ${styles.total}`}>
          <span>應付總額</span>
          <span className={styles.totalAmount}>$ {total}</span>
        </div>
      </div>

      {/* 選取項目數量 */}
      <div className={styles.selectedInfo}>
        已選取 {selectedCount} / {itemCount} 項商品
      </div>

      {/* 結帳按鈕 */}
      <Button
        variant="primary"
        fullWidth
        onClick={onCheckout}
        disabled={disabled}
        className={styles.checkoutBtn}
      >
        前往結帳 ({selectedCount})
      </Button>
    </div>
  );
}

export default CheckoutSummary;
