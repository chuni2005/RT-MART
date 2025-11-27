import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "@/shared/components/ProductCard";
import Alert from "@/shared/components/Alert";
import Button from "@/shared/components/Button";
import Icon from "@/shared/components/Icon";
import FilterSidebar from "./components/FilterSidebar";
import Pagination from "./components/Pagination";
import EmptyState from "./components/EmptyState";
import { getProducts } from "@/shared/services/productService";
import type { Product, AlertProps } from "@/types";
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

  // 篩選條件
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("relevance");

  // 分頁
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 16; // 4列 × 4行

  // 平板/手機版篩選抽屜
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // 無關鍵字時重定向至首頁
  useEffect(() => {
    if (!keyword || keyword.trim() === "") {
      navigate("/");
      return;
    }
  }, [keyword, navigate]);

  // 防止背景滾動（當抽屜打開時）
  useEffect(() => {
    if (isFilterOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [isFilterOpen]);

  // 載入商品資料
  const fetchProducts = async () => {
    if (!keyword) return;

    setIsLoading(true);
    setError(null);

    try {
      // 解析排序參數
      const [sortField, sortOrder] = sortBy.split("-");
      const params: any = {
        keyword,
        page: currentPage,
        limit: pageSize,
      };

      // 添加價格篩選
      if (minPrice !== null) params.minPrice = minPrice;
      if (maxPrice !== null) params.maxPrice = maxPrice;

      // 添加評價篩選
      if (rating !== null) params.minRating = rating;

      // 添加排序 (relevance 不傳排序參數)
      if (sortBy !== "relevance") {
        params.sortBy = sortField;
        params.order = sortOrder || "asc";
      }

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
  }, [keyword, minPrice, maxPrice, rating, sortBy]);

  // 分頁變更或初次載入時，重新載入商品
  useEffect(() => {
    if (!keyword) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, currentPage, minPrice, maxPrice, rating, sortBy]);

  // 計算總頁數
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );

  // 處理價格篩選
  const handlePriceChange = (min: number | null, max: number | null) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  // 處理評價篩選
  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating);
  };

  // 處理排序變更
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 重置篩選條件
  const handleResetFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setRating(null);
    setSortBy("relevance");
    setCurrentPage(1);
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
        {/* 左側篩選欄 */}
        <aside className={styles.sidebar}>
          <FilterSidebar
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            rating={rating}
            onRatingChange={handleRatingChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* 平板/手機版抽屜 */}
        {isFilterOpen && (
          <>
            <div
              className={styles.drawerBackdrop}
              onClick={() => setIsFilterOpen(false)}
            />
            <aside className={styles.drawerSidebar}>
              <div className={styles.drawerHeader}>
                <h2>篩選條件</h2>
                <Button
                  variant="ghost"
                  onClick={() => setIsFilterOpen(false)}
                  className={styles.closeButton}
                  ariaLabel="關閉篩選"
                >
                  <Icon icon="times" />
                </Button>
              </div>
              <div className={styles.drawerContent}>
                <FilterSidebar
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onPriceChange={handlePriceChange}
                  rating={rating}
                  onRatingChange={handleRatingChange}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  onReset={() => {
                    handleResetFilters();
                    setIsFilterOpen(false);
                  }}
                  onApply={() => setIsFilterOpen(false)}
                  total={total}
                />
              </div>
            </aside>
          </>
        )}

        {/* 右側主內容區 */}
        <main className={styles.mainContent}>
          {/* 搜尋結果標題 */}
          <div className={styles.resultHeader}>
            <div className={styles.resultHeaderTop}>
              <div>
                <h1 className={styles.resultTitle}>搜尋結果："{keyword}"</h1>
                <p className={styles.resultCount}>共 {total} 件商品</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className={styles.filterToggle}
              >
                <Icon icon="bars" size="sm" />
                篩選
              </Button>
            </div>
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