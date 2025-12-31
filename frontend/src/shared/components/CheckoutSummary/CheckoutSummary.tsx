import styles from "./CheckoutSummary.module.scss";
import Button from "@/shared/components/Button";
import type {
  CheckoutSummaryCartModeProps,
  CheckoutSummaryCheckoutModeProps,
} from "@/types";

type Props = CheckoutSummaryCartModeProps | CheckoutSummaryCheckoutModeProps;

function CheckoutSummary(props: Props) {
  const { onCheckout, disabled = false, buttonText = "前往結帳" } = props;

  // 結帳模式
  if (props.mode === "checkout") {
    const { storeGroups } = props;
    const totalItems = storeGroups.reduce((sum, g) => sum + g.items.length, 0);
    const subtotalAll = storeGroups.reduce((sum, g) => sum + g.subtotal, 0);
    const totalShippingDiscount = storeGroups.reduce((sum, g) => sum + g.shippingDiscount, 0);
    const grandTotal = storeGroups.reduce((sum, g) => sum + g.total, 0);

    // 計算基礎運費總額（每店 60）
    const baseShippingFee = storeGroups.length * 60;

    return (
      <div className={styles.checkoutSummary}>
        <h3>結帳資訊</h3>

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
          {totalShippingDiscount > 0 && (
            <div className={styles.row}>
              <span>運費折抵</span>
              <span className={styles.discount}>-$ {totalShippingDiscount}</span>
            </div>
          )}
          <div className={styles.divider} />
          <div className={`${styles.row} ${styles.total}`}>
            <span>應付總額</span>
            <span className={styles.totalAmount}>$ {grandTotal}</span>
          </div>
        </div>

        {/* 商品數量 */}
        <div className={styles.selectedInfo}>共 {totalItems} 項商品</div>

        {/* 結帳按鈕 */}
        <Button
          variant="primary"
          fullWidth
          onClick={onCheckout}
          disabled={disabled}
          className={styles.checkoutBtn}
        >
          {buttonText} ({storeGroups.length} 筆訂單)
        </Button>
      </div>
    );
  }

  // 購物車模式
  const {
    subtotal,
    shipping,
    shippingDiscount = 0,
    total,
    itemCount,
    selectedCount,
  } = props;

  // 計算基礎運費總額（實際運費 + 折抵）
  const baseShippingFee = shipping + shippingDiscount;

  return (
    <div className={styles.checkoutSummary}>
      <h3>結帳資訊</h3>

      {/* 價格明細 */}
      <div className={styles.priceBreakdown}>
        <div className={styles.row}>
          <span>商品總額</span>
          <span>$ {subtotal}</span>
        </div>
        <div className={styles.row}>
          <span>運費總額</span>
          <span>$ {baseShippingFee}</span>
        </div>
        {shippingDiscount > 0 && (
          <div className={styles.row}>
            <span>運費折抵</span>
            <span className={styles.discount}>-$ {shippingDiscount}</span>
          </div>
        )}
        <div className={styles.divider} />
        <div className={`${styles.row} ${styles.total}`}>
          <span>應付總額</span>
          <span className={styles.totalAmount}>$ {total}</span>
        </div>
      </div>

      <div className={styles.selectedInfo}>
        已選取 {selectedCount} / {itemCount} 項商品
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={onCheckout}
        disabled={disabled}
        className={styles.checkoutBtn}
      >
        {buttonText} ({selectedCount})
      </Button>
    </div>
  );
}

export default CheckoutSummary;
