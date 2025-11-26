import { ProductType } from '../../../types/product';
import Icon from '../Icon/Icon';
import styles from './CategoryBreadcrumb.module.scss';

interface CategoryBreadcrumbProps {
  productType: ProductType;
  platform?: string;
}

function CategoryBreadcrumb({ productType, platform = '蝦皮購物' }: CategoryBreadcrumbProps) {
  // Build the category path from root to current
  const buildCategoryPath = (type: ProductType): ProductType[] => {
    const path: ProductType[] = [];
    let current: ProductType | undefined = type;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  };

  const categoryPath = buildCategoryPath(productType);

  return (
    <div className={styles.breadcrumb}>
      {/* Platform name */}
      <span className={styles.breadcrumbItem}>{platform}</span>
      <Icon icon="chevron-right" className={styles.separator} />

      {/* Category path */}
      {categoryPath.map((category, index) => (
        <span key={category.productTypeId}>
          <span className={styles.breadcrumbItem}>{category.typeName}</span>
          {index < categoryPath.length - 1 && (
            <Icon icon="chevron-right" className={styles.separator} />
          )}
        </span>
      ))}
    </div>
  );
}

export default CategoryBreadcrumb;
