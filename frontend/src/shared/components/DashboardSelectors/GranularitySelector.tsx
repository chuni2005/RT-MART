import { useMemo } from "react";
import Select from "@/shared/components/Select";
import { SalesGranularity } from "@/types/seller";
import styles from "./ChartTypeSelector.module.scss";

interface GranularitySelectorProps {
  value: SalesGranularity | undefined;
  onChange: (granularity: SalesGranularity) => void;
  startDate?: string;
  endDate?: string;
  period?: string;
}

const ALL_GRANULARITIES: Array<{ value: SalesGranularity; label: string }> = [
  { value: "hour", label: "按時" },
  { value: "day", label: "按日" },
  { value: "week", label: "按週" },
  { value: "month", label: "按月" },
  { value: "year", label: "按年" },
];

function GranularitySelector({
  value,
  onChange,
  startDate,
  endDate,
  period,
}: GranularitySelectorProps) {
  const diffDays = useMemo(() => {
    let days = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (period === "year") {
      days = 365;
    } else if (period === "month") {
      days = 30;
    } else if (period === "week") {
      days = 7;
    } else if (period === "day") {
      days = 1;
    }
    return days;
  }, [startDate, endDate, period]);

  const availableOptions = useMemo(() => {
    return ALL_GRANULARITIES.filter((g) => {
      // 根據時間範圍長度過濾可用細度
      if (g.value === "hour") return diffDays <= 7; // > 7天不提供按時
      if (g.value === "day") return diffDays > 2 && diffDays <= 365; // > 365天不提供按日
      if (g.value === "week") return diffDays > 7; // > 7天才提供按週
      if (g.value === "month") return diffDays > 30; // > 30天才提供按月
      if (g.value === "year") return diffDays > 365; // > 365天才提供按年
      return true;
    });
  }, [diffDays]);

  const handleChange = (newValue: string) => {
    onChange(newValue as SalesGranularity);
  };

  return (
    <div className={styles.selectorWrapper}>
      <label className={styles.label}>時間細度：</label>
      <Select
        options={availableOptions}
        value={value || ""}
        onChange={handleChange}
        placeholder="預設"
        className={styles.select}
      />
    </div>
  );
}

export default GranularitySelector;
