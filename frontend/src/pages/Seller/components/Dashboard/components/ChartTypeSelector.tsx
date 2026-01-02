import Select from '@/shared/components/Select';
import { ChartType } from '@/types/seller';
import styles from './ChartTypeSelector.module.scss';

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

const CHART_TYPES: Array<{ value: ChartType; label: string }> = [
  { value: 'line', label: '折線圖' },
  { value: 'bar', label: '柱狀圖' },
  { value: 'pie', label: '圓餅圖' }
];

function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  const handleChange = (newValue: string) => {
    onChange(newValue as ChartType);
  };

  return (
    <div className={styles.selectorWrapper}>
      <label className={styles.label}>圖表類型：</label>
      <Select
        options={CHART_TYPES}
        value={value}
        onChange={handleChange}
        className={styles.select}
      />
    </div>
  );
}

export default ChartTypeSelector;
