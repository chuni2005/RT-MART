import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./ProductDetail.module.scss";
import ImageGallery from "./components/ImageGallery";
import ProductInfo from "./components/ProductInfo";
import PurchasePanel from "./components/PurchasePanel";
import StoreSection from "./components/StoreSection";
import ProductDescription from "./components/ProductDescription";
import ReviewSection from "./components/ReviewSection";
import { Product, Review, ReviewStatistics } from "@/types";
import {
  getProductById,
  getProductTypeById,
} from "@/shared/services/productService";
import {
  getReviewsByProductId,
  getReviewStatistics,
} from "@/shared/services/reviewService";

function ProductDetail() {
  const { product_id } = useParams<{ product_id: string }>();

  // State management
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      if (!product_id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch product, reviews, and statistics in parallel
        const [productResponse, reviewsResponse, statsResponse] =
          await Promise.all([
            getProductById(product_id),
            getReviewsByProductId(product_id),
            getReviewStatistics(product_id),
          ]);

        let productData = productResponse.product;

        // 如果商品有分類，則補全分類的完整層級資訊 (用於麵包屑)
        if (productData.productType?.productTypeId) {
          try {
            const fullType = await getProductTypeById(
              productData.productType.productTypeId
            );
            // 只有當成功取得完整的分類資訊時才更新，避免 undefined 蓋掉原本的資料
            if (fullType) {
              productData = {
                ...productData,
                productType: fullType,
              };
            }
          } catch (typeError) {
            console.warn(
              "Failed to fetch full product type hierarchy:",
              typeError
            );
          }
        }

        setProduct(productData);
        setReviews(reviewsResponse.reviews);
        setStatistics(statsResponse.statistics);
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError(err instanceof Error ? err.message : "載入商品資料失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [product_id]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.productDetail}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "2rem" }}>載入中...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className={styles.productDetail}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            {error || "商品不存在"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productDetail}>
      <div className={styles.container}>
        {/* 上方區塊：圖片 + 商品資訊 + 購買操作 */}
        <div className={styles.contentWrapper}>
          {/* 左側：圖片輪播區 */}
          <div className={styles.leftSection}>
            <ImageGallery images={product.images} />
          </div>

          {/* 右側：商品資訊 + 購買操作 */}
          <div className={styles.rightSection}>
            <ProductInfo
              name={product.name}
              currentPrice={product.currentPrice}
              originalPrice={product.originalPrice}
              rating={product.rating}
              reviewCount={product.reviewCount}
              soldCount={product.soldCount}
            />

            <PurchasePanel stock={product.stock} productId={product.id} />
          </div>
        </div>

        {/* 商店區塊 */}
        <StoreSection store={product.store} />

        {/* 商品資訊詳細區 */}
        <ProductDescription
          description={product.description}
          stock={product.stock}
          productType={product.productType}
          brand="PUMA"
          origin="桃園市大園區"
        />

        {/* 商品評價區 */}
        {statistics && (
          <ReviewSection reviews={reviews} statistics={statistics} />
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
