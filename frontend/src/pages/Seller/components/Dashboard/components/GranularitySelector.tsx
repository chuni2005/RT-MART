import { useMemo } from "react";
import Select from "@/shared/components/Select";
import { SalesGranularity } from "@/types/seller";
import styles from "./ChartTypeSelector.module.scss"; // Reuse styles or create new ones

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
  const { isLongPeriod, isMediumPeriod } = useMemo(() => {
    let diffDays = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (period === "year") {
      diffDays = 365;
    } else if (period === "month") {
      diffDays = 30;
    } else if (period === "week") {
      diffDays = 7;
    } else if (period === "day") {
      diffDays = 1;
    }

    return {
      isLongPeriod: diffDays >= 365,
      isMediumPeriod: diffDays > 7,
    };
  }, [startDate, endDate, period]);

  const availableOptions = useMemo(() => {
    let options = ALL_GRANULARITIES;
    if (isLongPeriod) {
      // 365天及以上不提供按時和按天
      options = options.filter((g) => g.value !== "hour" && g.value !== "day");
    } else if (isMediumPeriod) {
      // > 7天不提供按時
      options = options.filter((g) => g.value !== "hour");
    }
    return options;
  }, [isLongPeriod, isMediumPeriod]);

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
