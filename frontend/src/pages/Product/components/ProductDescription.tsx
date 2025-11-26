import { useState } from "react";
import styles from "./ProductDescription.module.scss";
import Icon from "@/shared/components/Icon/Icon";
import CategoryBreadcrumb from "@/shared/components/CategoryBreadcrumb/CategoryBreadcrumb";
import { ProductType } from "@/types/product";

interface ProductDescriptionProps {
  description: string;
  stock: number;
  productType?: ProductType;
  brand?: string;
  origin?: string;
}

function ProductDescription({
  description,
  stock,
  productType,
  brand,
  origin,
}: ProductDescriptionProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // 檢查描述是否超過3行（約150字元）
  const isLongDescription = description && description.length > 150;

  // 切換描述展開/收合
  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div className={styles.productDescription}>
      {/* 商品規格區塊 */}
      <div className={styles.specificationsSection}>
        <h2 className={styles.sectionTitle}>商品規格</h2>

        <div className={styles.specificationsList}>
          {/* 分類 */}
          {productType && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>分類</span>
              <div className={styles.specValue}>
                <CategoryBreadcrumb productType={productType} />
              </div>
            </div>
          )}

          {/* 庫存 */}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>庫存</span>
            <span
              className={`${styles.specValue} ${
                stock === 0
                  ? styles.outOfStockValue
                  : stock <= 10
                  ? styles.lowStock
                  : styles.normalStock
              }`}
            >
              {stock} 件
              {stock <= 10 && stock > 0 && (
                <span className={styles.lowStockWarning}> (剩餘不多)</span>
              )}
              {stock === 0 && (
                <span className={styles.outOfStock}> (已售完)</span>
              )}
            </span>
          </div>

          {/* 品牌 */}
          {brand && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>品牌</span>
              <span className={styles.specValue}>{brand}</span>
            </div>
          )}

          {/* 出貨地 */}
          {origin && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>出貨地</span>
              <span className={styles.specValue}>{origin}</span>
            </div>
          )}
        </div>
      </div>

      {/* 商品描述區塊 */}
      <div className={styles.descriptionSection}>
        <h2 className={styles.sectionTitle}>商品描述</h2>
        <div
          className={`${styles.descriptionContent} ${
            isDescriptionExpanded || !isLongDescription
              ? styles.expanded
              : styles.collapsed
          }`}
        >
          <p>{description}</p>
        </div>

        {/* 展開/收合按鈕 */}
        {isLongDescription && (
          <button className={styles.toggleButton} onClick={toggleDescription}>
            {isDescriptionExpanded ? (
              <>
                收合 <Icon icon="chevron-up" />
              </>
            ) : (
              <>
                展開完整描述 <Icon icon="chevron-down" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductDescription;
