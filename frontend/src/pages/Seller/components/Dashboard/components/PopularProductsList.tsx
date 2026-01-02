import Icon from '@/shared/components/Icon';
import { PopularProduct } from '@/types/seller';
import styles from './PopularProductsList.module.scss';

interface PopularProductsListProps {
  products: PopularProduct[];
  onProductClick: (productId: string) => void;
}

function PopularProductsList({ products, onProductClick }: PopularProductsListProps) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon="box" />
        <p>尚無銷售資料</p>
      </div>
    );
  }

  return (
    <div className={styles.productsList}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className={styles.productItem}
          onClick={() => onProductClick(product.id)}
        >
          <div className={styles.rank}>#{index + 1}</div>
          <img
            src={product.image}
            alt={product.name}
            className={styles.productImage}
          />
          <div className={styles.productInfo}>
            <h4 className={styles.productName}>{product.name}</h4>
            <div className={styles.productStats}>
              <span className={styles.sales}>銷量: {product.salesCount}</span>
              <span className={styles.revenue}>
                營收: NT$ {product.revenue.toLocaleString()}
              </span>
            </div>
          </div>
          <Icon icon="chevron-right" className={styles.arrow} />
        </div>
      ))}
    </div>
  );
}

export default PopularProductsList;
