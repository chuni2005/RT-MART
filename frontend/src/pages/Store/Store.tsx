import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import styles from "./Store.module.scss";
import StoreSection from "../Product/components/StoreSection";
import CategoryFilter from "./components/CategoryFilter";
import ProductCard from "@/shared/components/ProductCard";
import { getStoreById } from "@/shared/services/storeService";
import { getProductsByStore } from "@/shared/services/productService";
import type { Store as StoreType, Product, TabItem } from "@/types";

function Store() {
  const { store_id } = useParams<{ store_id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ========== 資料載入 ==========
  useEffect(() => {
    const fetchData = async () => {
      if (!store_id) {
        alert('無效的商店 ID');
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);

        // 並行載入商店和商品資料（使用 allSettled 實現部分容錯）
        const [storeResult, productsResult] = await Promise.allSettled([
          getStoreById(store_id),
          getProductsByStore(store_id)
        ]);

        // 處理商店資料
        if (storeResult.status === 'fulfilled') {
          setStore(storeResult.value.store);
        } else {
          console.error('Failed to load store:', storeResult.reason);
          alert(storeResult.reason instanceof Error ? storeResult.reason.message : '載入商店資料失敗');
          navigate('/');
          return; // 商店資料是必須的，失敗則返回首頁
        }

        // 處理商品資料（可選）
        if (productsResult.status === 'fulfilled') {
          setProducts(productsResult.value.products);
        } else {
          console.error('Failed to load products:', productsResult.reason);
          // 商品載入失敗時，保持空陣列，頁面仍可顯示商店信息
          setProducts([]);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        alert('發生未預期的錯誤');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [store_id, navigate]);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, TabItem>();
    categoryMap.set("all", {
      key: "all",
      label: "全部商品",
      count: products.length,
    });
    products.forEach((product) => {
      if (product.productType) {
        const key = product.productType.productTypeId;
        const existing = categoryMap.get(key);
        if (existing) {
          existing.count = (existing.count || 0) + 1;
        } else {
          categoryMap.set(key, {
            key,
            label: product.productType.typeName,
            count: 1,
          });
        }
      }
    });
    return Array.from(categoryMap.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter(
      (p) => p.productType?.productTypeId === activeCategory
    );
  }, [products, activeCategory]);

  const handleProductClick = (productId: string | number) => {
    navigate(`/product/${productId}`);
  };

  // ========== Loading 狀態 ==========
  if (isLoading) {
    return (
      <div className={styles.storePage}>
        <div className={styles.container}>
          <div className={styles.loading}>載入中...</div>
        </div>
      </div>
    );
  }

  // ========== 資料不存在 ==========
  if (!store) {
    return null; // 已在 useEffect 中處理導向
  }

  return (
    <div className={styles.storePage}>
      <div className={styles.container}>
        <StoreSection store={store} variant="detailed" hideButton={true} />
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              currentPrice={product.currentPrice}
              originalPrice={product.originalPrice}
              image={product.images[0]}
              rating={product.rating}
              soldCount={product.soldCount}
              onClick={handleProductClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Store;
