import styles from './ProductCard.module.scss';

interface ProductCardProps {
  id: string | number;
  name: string;
  currentPrice: number;
  originalPrice?: number;
  image?: string;
  rating?: number;
  soldCount?: string;
  onClick?: (id: string | number) => void;
}

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
          <span>{'⭐'.repeat(rating)}</span>
          {soldCount && (
            <span className={styles.soldCount}>已售 {soldCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
