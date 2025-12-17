import Button from '@/shared/components/Button';
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
  return (
    <div className={styles.selector}>
      {PERIODS.map(period => (
        <Button
          key={period.value}
          variant={value === period.value ? 'primary' : 'outline'}
          onClick={() => onChange(period.value)}
          className={styles.periodButton}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

export default SalesPeriodSelector;
