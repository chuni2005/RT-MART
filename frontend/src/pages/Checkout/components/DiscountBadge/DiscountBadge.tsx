import { useState } from 'react';
import styles from './DiscountBadge.module.scss';
import type { DiscountRecommendation } from '@/types/order';

interface DiscountBadgeProps {
  discounts: DiscountRecommendation;
  onRemove: () => void;
}

function DiscountBadge({ discounts, onRemove }: DiscountBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { shipping, product, totalSavings } = discounts;

  if (totalSavings === 0) return null;

  return (
    <div className={styles.badge}>
      <div
        className={styles.content}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className={styles.icon}>✓</span>
        <span className={styles.text}>
          已為您節省 ${totalSavings}
        </span>
        <button
          className={styles.removeBtn}
          onClick={onRemove}
          aria-label="移除優惠"
        >
          ×
        </button>
      </div>

      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>已套用優惠：</div>
          {shipping && (
            <div className={styles.tooltipItem}>
              <strong>{shipping.code}</strong> - {shipping.name}
              <br />
              <span className={styles.amount}>運費折抵 ${shipping.amount}</span>
            </div>
          )}
          {product && (
            <div className={styles.tooltipItem}>
              <strong>{product.code}</strong> - {product.name}
              <br />
              <span className={styles.amount}>商品折扣 ${product.amount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DiscountBadge;
