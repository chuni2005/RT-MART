import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ProductDescription.module.scss';
import Icon from '../../../shared/components/Icon/Icon';

function ProductDescription({ description, stock }) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // 檢查描述是否超過3行（約150字元）
  const isLongDescription = description && description.length > 150;

  // 切換描述展開/收合
  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div className={styles.productDescription}>
      {/* 區塊標題 */}
      <h2 className={styles.sectionTitle}>商品資訊</h2>

      {/* 庫存資訊 */}
      <div className={styles.stockSection}>
        <span className={styles.stockLabel}>庫存:</span>
        <span className={`${styles.stockValue} ${stock <= 10 ? styles.lowStock : ''}`}>
          {stock} 件
          {stock <= 10 && stock > 0 && <span className={styles.lowStockWarning}> (剩餘不多)</span>}
          {stock === 0 && <span className={styles.outOfStock}> (已售完)</span>}
        </span>
      </div>

      {/* 商品描述 */}
      <div className={styles.descriptionSection}>
        <h3 className={styles.descriptionTitle}>商品描述</h3>
        <div
          className={`${styles.descriptionContent} ${
            isDescriptionExpanded || !isLongDescription ? styles.expanded : styles.collapsed
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

ProductDescription.propTypes = {
  description: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
};

export default ProductDescription;
