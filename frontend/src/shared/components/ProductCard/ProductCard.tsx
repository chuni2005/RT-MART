import type { ProductCardProps } from '@/types';
import styles from './ProductCard.module.scss';
import Icon from '@/shared/components/Icon';

function ProductCard({
  id,
  name,
  currentPrice,
  originalPrice,
  image,
  rating = 5,
  soldCount,
  onClick,
}: ProductCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div className={styles.productCard} onClick={handleClick}>
      <div className={styles.productImage}>
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <div className={styles.placeholder}>商品圖片</div>
        )}
      </div>
      <div className={styles.productInfo}>
        <h4 className={styles.productName}>{name}</h4>
        <p className={styles.productPrice}>
          <span className={styles.currentPrice}>NT$ {currentPrice}</span>
          {originalPrice && (
            <span className={styles.originalPrice}>NT$ {originalPrice}</span>
          )}
        </p>
        <div className={styles.productRating}>
          <div className={styles.ratingStars}>
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <Icon
                  key={index}
                  icon="star"
                  size="sm"
                  className={`${styles.starIcon} ${
                    index < Math.floor(rating) ? styles.filled : styles.empty
                  }`}
                />
              ))}
            <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
          </div>
          {soldCount && (
            <span className={styles.soldCount}>已售 {soldCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
