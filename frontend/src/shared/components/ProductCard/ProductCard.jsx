import React from 'react';
import PropTypes from 'prop-types';
import styles from './ProductCard.module.scss';

function ProductCard({
  id,
  name,
  currentPrice,
  originalPrice,
  image,
  rating = 5,
  soldCount,
  onClick,
}) {
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
          <span>{'⭐'.repeat(rating)}</span>
          {soldCount && (
            <span className={styles.soldCount}>已售 {soldCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  currentPrice: PropTypes.number.isRequired,
  originalPrice: PropTypes.number,
  image: PropTypes.string,
  rating: PropTypes.number,
  soldCount: PropTypes.string,
  onClick: PropTypes.func,
};

export default ProductCard;
