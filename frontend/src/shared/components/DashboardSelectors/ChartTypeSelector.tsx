import Select from "@/shared/components/Select";
import { ChartType } from "@/types/seller";
import styles from "./ChartTypeSelector.module.scss";

interface ChartTypeOption {
  value: ChartType;
  label: string;
}

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  options?: ChartTypeOption[];
}

const DEFAULT_TYPES: ChartTypeOption[] = [
  { value: "line", label: "折線圖" },
  { value: "bar", label: "柱狀圖" },
  { value: "pie", label: "圓餅圖" },
];

function ChartTypeSelector({
  value,
  onChange,
  options = DEFAULT_TYPES,
}: ChartTypeSelectorProps) {
  const handleChange = (newValue: string) => {
    onChange(newValue as ChartType);
  };

  return (
    <div className={styles.selectorWrapper}>
      <label className={styles.label}>圖表類型：</label>
      <Select
        options={options}
        value={value}
        onChange={handleChange}
        className={styles.select}
      />
    </div>
  );
}

export default ChartTypeSelector;
