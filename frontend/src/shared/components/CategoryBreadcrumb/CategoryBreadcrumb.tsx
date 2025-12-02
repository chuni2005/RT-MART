import { useNavigate } from "react-router-dom";
import { ProductType } from "@/types/product";
import Icon from "../Icon/Icon";
import styles from "./CategoryBreadcrumb.module.scss";

interface CategoryBreadcrumbProps {
  productType: ProductType;
  platform?: string;
}

function CategoryBreadcrumb({
  productType,
  platform = "蝦皮購物",
}: CategoryBreadcrumbProps) {
  const navigate = useNavigate();
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

  // 處理分類點擊，跳轉到搜尋頁面並套用該分類篩選
  const handleCategoryClick = (categoryId: string) => {
    // 建構搜尋 URL，使用空關鍵字但帶上分類 ID
    // 實際上會在搜尋頁面顯示該分類的所有商品
    navigate(`/search?q=&category=${categoryId}`);
  };

  // 處理平台點擊，跳轉到首頁或所有商品頁面
  const handlePlatformClick = () => {
    navigate("/");
  };

  return (
    <div className={styles.breadcrumb}>
      {/* Platform name */}
      <span
        className={styles.breadcrumbItem}
        onClick={handlePlatformClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handlePlatformClick()}
      >
        {platform}
      </span>
      <Icon icon="chevron-right" className={styles.separator} />

      {/* Category path */}
      {categoryPath.map((category, index) => (
        <span key={category.productTypeId}>
          <span
            className={styles.breadcrumbItem}
            onClick={() => handleCategoryClick(category.productTypeId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && handleCategoryClick(category.productTypeId)
            }
          >
            {category.typeName}
          </span>
          {index < categoryPath.length - 1 && (
            <Icon icon="chevron-right" className={styles.separator} />
          )}
        </span>
      ))}
    </div>
  );
}

export default CategoryBreadcrumb;
