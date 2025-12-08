import Icon from '../Icon';
import Button from '../Button';
import styles from './QuantitySelector.module.scss';
import type { QuantitySelectorProps } from '@/types';

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  readOnly = false,
  onValidationError,
  onBlur,
  className = '',
  size = 'lg',
  ariaLabel,
}: QuantitySelectorProps) {
  // 增加數量
  const handleIncrease = () => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || min : value;
    if (numValue < max) {
      onChange(numValue + 1);
    }
  };

  // 減少數量
  const handleDecrease = () => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || min : value;
    if (numValue > min) {
      onChange(numValue - 1);
    }
  };

  // 手動輸入數量
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;

    const inputValue = e.target.value;

    // 允許空值（用戶可能正在輸入）
    if (inputValue === '') {
      onChange('');
      return;
    }

    // 驗證是否為數字
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      return;
    }

    // 限制範圍
    if (numValue < min) {
      onChange(min);
    } else if (numValue > max) {
      onChange(max);
      if (onValidationError) {
        onValidationError(`最多只能購買 ${max} 件`);
      }
    } else {
      onChange(numValue);
    }
  };

  // 輸入框失去焦點時的處理
  const handleInputBlur = () => {
    if (readOnly) return;

    // 如果是空值，設定為 min
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (value === '' || isNaN(numValue) || numValue < min) {
      onChange(min);
    }

    if (onBlur) {
      onBlur();
    }
  };

  const numValue = typeof value === 'string' ? parseInt(value, 10) || min : value;

  const containerClasses = [
    styles.quantitySelector,
    styles[`size-${size}`],
    disabled && styles.disabled,
    readOnly && styles.readOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const buttonClasses = [
    styles.quantityButton,
    styles[`size-${size}`],
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    styles.quantityInput,
    styles[`size-${size}`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <Button
        className={buttonClasses}
        onClick={handleDecrease}
        disabled={disabled || numValue <= min}
        aria-label={ariaLabel || '減少數量'}
        type="button"
      >
        <Icon icon="minus" />
      </Button>

      <input
        type="text"
        className={inputClasses}
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel || '商品數量'}
      />

      <Button
        className={buttonClasses}
        onClick={handleIncrease}
        disabled={disabled || numValue >= max}
        aria-label={ariaLabel || '增加數量'}
        type="button"
      >
        <Icon icon="plus" />
      </Button>
    </div>
  );
}

export default QuantitySelector;
