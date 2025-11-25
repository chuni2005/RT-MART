import PropTypes from 'prop-types';
import styles from './ProductInfo.module.scss';
import Icon from '../../../shared/components/Icon/Icon';

function ProductInfo({ name, currentPrice, originalPrice, rating, reviewCount, soldCount }) {
  // 計算折扣百分比
  const calculateDiscount = () => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return discount;
  };

  const discount = calculateDiscount();

  // 渲染星星
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        className={i < Math.round(rating) ? styles.starFilled : styles.starEmpty}
      />
    ));
  };

  return (
    <div className={styles.productInfo}>
      {/* 商品名稱 */}
      <h1 className={styles.productName}>{name}</h1>

      {/* 評價統計列 */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{rating?.toFixed(1) || '0.0'}</span>
          <div className={styles.stars}>{renderStars()}</div>
        </div>
        <span className={styles.divider}>|</span>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{reviewCount?.toLocaleString() || 0}</span>
          <span className={styles.statLabel}>評價</span>
        </div>
        <span className={styles.divider}>|</span>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{soldCount?.toLocaleString() || 0}</span>
          <span className={styles.statLabel}>已售出</span>
        </div>
      </div>

      {/* 價格區 */}
      <div className={styles.priceSection}>
        <div className={styles.priceContainer}>
          <span className={styles.currentPrice}>NT$ {currentPrice.toLocaleString()}</span>
          {originalPrice && originalPrice > currentPrice && (
            <>
              <span className={styles.originalPrice}>NT$ {originalPrice.toLocaleString()}</span>
              {discount && <span className={styles.discountBadge}>-{discount}%</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

ProductInfo.propTypes = {
  name: PropTypes.string.isRequired,
  currentPrice: PropTypes.number.isRequired,
  originalPrice: PropTypes.number,
  rating: PropTypes.number,
  reviewCount: PropTypes.number,
  soldCount: PropTypes.number,
};

export default ProductInfo;
