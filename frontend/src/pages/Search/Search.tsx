import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "@/shared/components/ProductCard";
import Alert from "@/shared/components/Alert";
import Button from "@/shared/components/Button";
import Pagination from "./components/Pagination";
import EmptyState from "./components/EmptyState";
import { getProducts } from "@/shared/services/productService";
import type { Product } from "@/types";
import styles from "./Search.module.scss";

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("q") || "";

  // 商品資料
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 分頁
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 16; // 4列 × 4行

  // 無關鍵字時重定向至首頁
  useEffect(() => {
    if (!keyword || keyword.trim() === "") {
      navigate("/");
      return;
    }
  }, [keyword, navigate]);

  // 載入商品資料
  const fetchProducts = async () => {
    if (!keyword) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: any = {
        keyword,
        page: currentPage,
        limit: pageSize,
      };
      const response = await getProducts(params);
      setProducts(response.products);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗，請稍後再試");
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 篩選條件變更時，重置到第 1 頁並重新載入
  useEffect(() => {
    if (!keyword) return;
    setCurrentPage(1);
  }, [keyword]);

  // 分頁變更或初次載入時，重新載入商品
  useEffect(() => {
    if (!keyword) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, currentPage]);

  // 計算總頁數
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  // 處理商品點擊
  const handleProductClick = (productId: string | number) => {
    navigate(`/product/${productId}`);
  };

  // 顯示 Loading 狀態
  if (isLoading) {
    return (
      <div className={styles.searchPage}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.searchPage}>
      <div className={styles.container}>
        {/* TODO:左側篩選欄 */}

        {/* 右側主內容區 */}
        <main className={styles.mainContent}>
          {/* 搜尋結果標題 */}
          <div className={styles.resultHeader}>
            <h1 className={styles.resultTitle}>搜尋結果："{keyword}"</h1>
            <p className={styles.resultCount}>共 {total} 件商品</p>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <>
              <Alert
                type="error"
                message={error}
                className={styles.errorAlert}
              />
              <Button
                type="button"
                onClick={fetchProducts}
                fullWidth={false}
                className={styles.retryButton}
              >
                重試
              </Button>
            </>
          )}

          {/* 商品網格或空狀態 */}
          {!error && (
            <>
              {products.length === 0 ? (
                <EmptyState keyword={keyword} />
              ) : (
                <>
                  <div className={styles.productGrid}>
                    {products.map((product) => (
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

                  {/* 分頁控制 */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Search;
