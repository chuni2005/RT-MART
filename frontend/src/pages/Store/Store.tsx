import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import styles from "./Store.module.scss";
import StoreSection from "../Product/components/StoreSection";
import CategoryFilter from "./components/CategoryFilter";
import ProductCard from "@/shared/components/ProductCard";
import { getStoreById } from "@/shared/services/storeService";
import type { Store as StoreType, Product, TabItem } from "@/types";

// Mock 資料 - 商品相關 (暫時保留，待 productService 完成後移除)
const productNames = [
  "藍牙耳機",
  "智能手錶",
  "無線滑鼠",
  "T恤",
  "牛仔褲",
  "沙發",
];
const categoryIds = ["electronics", "clothing", "home"];
const categoryCodes = ["ELEC", "CLOTH", "HOME"];
const categoryNames = ["電子產品", "服飾", "家居用品"];

// 簡化的 Mock Store 用於產品關聯 (臨時使用)
const tempMockStore: StoreType = {
  id: "store_001",
  name: "科技生活旗艦店",
  avatar: "https://i.pravatar.cc/150?img=10",
  productCount: 30,
  rating: 4.8,
  totalRatings: 150,
  joinDate: "2023/01",
  description: "專營3C電子產品、智能家居和配件。",
  address: "台北市大安區忠孝東路三段 100 號",
  email: "contact@techlife.com",
  phone: "02-2345-6789",
};

const mockProducts: Product[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `${tempMockStore.name} - ${productNames[i % productNames.length]} ${i + 1}`,
  currentPrice: 299 + i * 50,
  originalPrice: i % 3 === 0 ? 399 + i * 50 : null,
  description: "優質商品，值得信賴",
  stock: 100 - i,
  rating: 4 + Math.random(),
  reviewCount: Math.floor(Math.random() * 100),
  soldCount: Math.floor(Math.random() * 1000),
  images: [`https://picsum.photos/seed/${i + 1}/400/400`],
  store: tempMockStore,
  productType: {
    productTypeId: categoryIds[i % 3],
    typeCode: categoryCodes[i % 3],
    typeName: categoryNames[i % 3],
    parentTypeId: null,
    isActive: true,
  },
}));

function Store() {
  const { store_id } = useParams<{ store_id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const products = mockProducts;

  // ========== 資料載入 ==========
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!store_id) {
        alert('無效的商店 ID');
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        const response = await getStoreById(store_id);
        setStore(response.store);
      } catch (error) {
        console.error('Failed to load store:', error);
        alert(error instanceof Error ? error.message : '載入商店資料失敗');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
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
