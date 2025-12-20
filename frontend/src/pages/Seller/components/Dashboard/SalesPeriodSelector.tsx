import Select from '@/shared/components/Select';
import { SalesPeriod } from '@/types/seller';
import styles from './SalesPeriodSelector.module.scss';

interface SalesPeriodSelectorProps {
  value: SalesPeriod;
  onChange: (period: SalesPeriod) => void;
}

const PERIODS: Array<{ value: SalesPeriod; label: string }> = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' }
];

function SalesPeriodSelector({ value, onChange }: SalesPeriodSelectorProps) {
  const handleChange = (newValue: string) => {
    onChange(newValue as SalesPeriod);
  };

  return (
    <div className={styles.selectorWrapper}>
      <label className={styles.label}>時間區間：</label>
      <Select
        options={PERIODS}
        value={value}
        onChange={handleChange}
        className={styles.select}
      />
    </div>
  );
}

export default SalesPeriodSelector;
