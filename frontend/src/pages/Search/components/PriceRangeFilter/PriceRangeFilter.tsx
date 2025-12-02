import React, { useState, useEffect } from 'react';
import Button from '@/shared/components/Button/Button';
import styles from './PriceRangeFilter.module.scss';

export interface PriceRangeFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

function PriceRangeFilter({ minPrice, maxPrice, onChange }: PriceRangeFilterProps) {
  const [tempMin, setTempMin] = useState<string>(minPrice?.toString() || '');
  const [tempMax, setTempMax] = useState<string>(maxPrice?.toString() || '');
  const [error, setError] = useState<string>('');

  // 當外部 props 變更時同步到本地 state
  useEffect(() => {
    setTempMin(minPrice?.toString() || '');
    setTempMax(maxPrice?.toString() || '');
  }, [minPrice, maxPrice]);

  const handleApply = () => {
    setError('');

    // 轉換為數字或 null
    const min = tempMin.trim() ? parseInt(tempMin) : null;
    const max = tempMax.trim() ? parseInt(tempMax) : null;

    // 驗證：檢查是否為有效數字
    if (tempMin.trim() && isNaN(min!)) {
      setError('請輸入有效的最低價');
      return;
    }

    if (tempMax.trim() && isNaN(max!)) {
      setError('請輸入有效的最高價');
      return;
    }

    // 驗證：價格不能為負數
    if ((min !== null && min < 0) || (max !== null && max < 0)) {
      setError('價格不能為負數');
      return;
    }

    // 驗證：最低價不能大於最高價
    if (min !== null && max !== null && min > max) {
      setError('最低價不能大於最高價');
      return;
    }

    // 驗證通過，觸發變更
    onChange(min, max);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className={styles.priceFilter}>
      <h3 className={styles.filterTitle}>價格範圍</h3>
      <div className={styles.priceInputs}>
        <input
          type="number"
          className={styles.priceInput}
          value={tempMin}
          onChange={(e) => setTempMin(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="最低價"
          min="0"
        />
        <span className={styles.separator}>~</span>
        <input
          type="number"
          className={styles.priceInput}
          value={tempMax}
          onChange={(e) => setTempMax(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="最高價"
          min="0"
        />
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <Button
        variant="primary"
        onClick={handleApply}
        fullWidth={true}
        className={styles.applyButton}
      >
        套用
      </Button>
    </div>
  );
}

export default PriceRangeFilter;
