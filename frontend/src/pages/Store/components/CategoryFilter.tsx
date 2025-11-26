import Tab from "@/shared/components/Tab";
import Select from "@/shared/components/Select";
import type { TabItem } from "@/types";
import styles from "./CategoryFilter.module.scss";

interface CategoryFilterProps {
  categories: TabItem[];
  activeCategory: string;
  onChange: (key: string) => void;
  maxVisibleTabs?: number;
}

function CategoryFilter({
  categories,
  activeCategory,
  onChange,
  maxVisibleTabs = 6,
}: CategoryFilterProps) {
  const visibleCategories = categories.slice(0, maxVisibleTabs);
  const moreCategories = categories.slice(maxVisibleTabs);

  // 检查 active 分类是否在"更多"里
  const activeInMore = moreCategories.some((c) => c.key === activeCategory);

  return (
    <div className={styles.categoryFilter}>
      <Tab
        items={visibleCategories}
        activeTab={activeInMore ? "" : activeCategory}
        onChange={onChange}
        variant="underline"
      />

      {moreCategories.length > 0 && (
        <Select
          options={moreCategories.map((c) => ({
            value: c.key,
            label: `${c.label}${c.count ? ` (${c.count})` : ""}`,
          }))}
          value={activeInMore ? activeCategory : ""}
          onChange={onChange}
          ariaLabel="查看更多分類"
        />
      )}
    </div>
  );
}

export default CategoryFilter;
