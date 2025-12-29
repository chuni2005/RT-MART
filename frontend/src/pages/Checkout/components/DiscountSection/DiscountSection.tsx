import { useState } from 'react';
import Button from '@/shared/components/Button';
import styles from './DiscountSection.module.scss';
import type { ManualDiscountSelection } from '@/types/order';

interface DiscountSectionProps {
  appliedDiscounts: ManualDiscountSelection | null;
  onChangeClick: () => void;
}

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

function DiscountSection({ appliedDiscounts, onChangeClick }: DiscountSectionProps) {
  const hasDiscount = appliedDiscounts?.shipping || appliedDiscounts?.seasonal || appliedDiscounts?.special;

  return (
    <div className={styles.discountSection}>
      <div className={styles.header}>
        <h3>商品折扣</h3>
        <Button variant="ghost" size="sm" onClick={onChangeClick}>
          變更
        </Button>
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
  );
}

export default DiscountSection;
