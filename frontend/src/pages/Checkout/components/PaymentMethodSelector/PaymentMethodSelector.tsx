import type { PaymentMethod } from '@/types/order';
import styles from './PaymentMethodSelector.module.scss';

interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  className?: string;
}

/**
 * PaymentMethodSelector Component
 * 付款方式選擇器
 *
 * @param value - 當前選中的付款方式
 * @param onChange - 付款方式變更的回調函數
 * @param className - 額外的 CSS class
 */
function PaymentMethodSelector({
  value,
  onChange,
  className = '',
}: PaymentMethodSelectorProps) {
  return (
    <div className={`${styles.paymentMethods} ${className}`}>
      {/* 信用卡選項 */}
      <div
        className={`${styles.methodCard} ${
          value === 'credit_card' ? styles.selected : ''
        }`}
        onClick={() => onChange('credit_card')}
      >
        <input
          type="radio"
          name="payment"
          checked={value === 'credit_card'}
          onChange={() => onChange('credit_card')}
        />
        <div className={styles.methodContent}>
          <h4>信用卡</h4>
          <p>支援 Visa、Mastercard、JCB</p>
        </div>
      </div>

      {/* 貨到付款選項 */}
      <div
        className={`${styles.methodCard} ${
          value === 'cash_on_delivery' ? styles.selected : ''
        }`}
        onClick={() => onChange('cash_on_delivery')}
      >
        <input
          type="radio"
          name="payment"
          checked={value === 'cash_on_delivery'}
          onChange={() => onChange('cash_on_delivery')}
        />
        <div className={styles.methodContent}>
          <h4>貨到付款</h4>
          <p>收到商品時以現金付款</p>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
