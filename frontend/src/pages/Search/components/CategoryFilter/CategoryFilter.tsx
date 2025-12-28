import styles from "./CategoryFilter.module.scss";

export interface CategoryFilterProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categories: Array<{
    productTypeId: string;
    typeName: string;
    count: number;
    parentTypeId?: string | null;
  }>;
  totalCount?: number; // 全部商品的數量
  showAllOption?: boolean; // 是否顯示「全部商品」選項（預設為 true）
}

function CategoryFilter({
  value,
  onChange,
  categories,
  totalCount,
  showAllOption = true,
}: CategoryFilterProps) {
  const handleChange = (categoryId: string | null) => {
    onChange(categoryId);
  };

  return (
    <div className={styles.categoryFilter}>
      <h3 className={styles.filterTitle}>商品分類</h3>
      <div className={styles.categoryOptions}>
        {/* "全部" 選項（僅在 showAllOption 為 true 時顯示） */}
        {showAllOption && (
          <label
            htmlFor="category-all"
            className={`${styles.categoryOption} ${
              value === null ? styles.active : ""
            }`}
          >
            <input
              type="radio"
              id="category-all"
              name="category"
              value=""
              checked={value === null}
              onChange={() => handleChange(null)}
              className={styles.radioInput}
            />
            <span className={styles.optionLabel}>
              <span className={styles.text}>全部商品</span>
              {totalCount !== undefined && totalCount > 0 && (
                <span className={styles.count}>({totalCount})</span>
              )}
            </span>
          </label>
        )}

        {/* 各分類選項 */}
        {categories.map((category) => {
          const isChecked = value === category.productTypeId;
          const optionId = `category-${category.productTypeId}`;
          const isSubCategory = !!category.parentTypeId;

          return (
            <label
              key={optionId}
              htmlFor={optionId}
              className={`${styles.categoryOption} ${
                isChecked ? styles.active : ""
              } ${isSubCategory ? styles.subCategory : ""}`}
            >
              <input
                type="radio"
                id={optionId}
                name="category"
                value={category.productTypeId}
                checked={isChecked}
                onChange={() => handleChange(category.productTypeId)}
                className={styles.radioInput}
              />
              <span className={styles.optionLabel}>
                <span className={styles.text}>{category.typeName}</span>
                {category.count > 0 && (
                  <span className={styles.count}>({category.count})</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilter;
