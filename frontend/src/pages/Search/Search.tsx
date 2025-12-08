import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "@/shared/components/ProductCard";
import Alert from "@/shared/components/Alert";
import Button from "@/shared/components/Button";
import Icon from "@/shared/components/Icon";
import FilterSidebar from "./components/FilterSidebar";
import Pagination from "./components/Pagination";
import EmptyState from '@/shared/components/EmptyState';
import { getProducts, getProductTypes } from "@/shared/services/productService";
import type { Product, ProductType } from "@/types";
import styles from "./Search.module.scss";

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("q") || "";
  const categoryId = searchParams.get("category");  // 直接從 URL 讀取，不用狀態

  // 商品資料
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 所有分類
  const [allProductTypes, setAllProductTypes] = useState<ProductType[]>([]);

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

  // 不含分類篩選的商品（用於計算正確的分類數量）
  const [categoriesWithoutFilter, setCategoriesWithoutFilter] = useState<Product[]>([]);

  // 無關鍵字且無分類時重定向至首頁
  useEffect(() => {
    if ((!keyword || keyword.trim() === "") && !categoryId) {
      navigate("/");
      return;
    }
  }, [keyword, categoryId, navigate]);

  // 載入所有分類
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const types = await getProductTypes();
        setAllProductTypes(types);
      } catch (err) {
        console.error("Failed to fetch product types:", err);
      }
    };

    fetchProductTypes();
  }, []);

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
    // 必須有關鍵字或分類才能搜尋
    if (!keyword && !categoryId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 解析排序參數
      const [sortField, sortOrder] = sortBy.split("-");
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      // 添加關鍵字（如果有）
      if (keyword) {
        params.keyword = keyword;
      }

      // 添加分類篩選
      if (categoryId !== null) params.productTypeId = categoryId;

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
    // 必須有關鍵字或分類
    if (!keyword && !categoryId) return;
    setCurrentPage(1);
  }, [keyword, minPrice, maxPrice, rating, sortBy, categoryId]);

  // 分頁變更或初次載入時，重新載入商品
  useEffect(() => {
    // 必須有關鍵字或分類
    if (!keyword && !categoryId) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, currentPage, minPrice, maxPrice, rating, sortBy, categoryId]);

  // 當選擇分類時，取得不含分類篩選的商品（用於計算正確的分類數量）
  useEffect(() => {
    // 只在有關鍵字且有選擇分類時才需要額外呼叫
    if (!keyword || !categoryId) {
      setCategoriesWithoutFilter([]);
      return;
    }

    const fetchCategoriesCount = async () => {
      try {
        const params: any = {
          keyword,
          page: 1,
          limit: 9999, // 需要所有商品來計算分類數量
        };

        // 添加其他篩選條件（但不包含 categoryId）
        if (minPrice !== null) params.minPrice = minPrice;
        if (maxPrice !== null) params.maxPrice = maxPrice;
        if (rating !== null) params.minRating = rating;

        const response = await getProducts(params);
        setCategoriesWithoutFilter(response.products);
      } catch (err) {
        console.error("Failed to fetch categories count:", err);
      }
    };

    fetchCategoriesCount();
  }, [keyword, categoryId, minPrice, maxPrice, rating]);

  // 計算總頁數
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );

  // 計算所有分類選項及其商品數量
  const categories = useMemo(() => {
    const countMap = new Map<string, number>();

    // 如果有選擇分類，使用不含分類篩選的商品來計算
    // 這樣才能顯示正確的「在當前搜尋下，每個分類有多少商品」
    const productsForCount = categoryId && keyword ? categoriesWithoutFilter : products;

    productsForCount.forEach((product) => {
      if (product.productType) {
        const key = product.productType.productTypeId;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });

    // 將所有分類與商品數量結合
    return allProductTypes.map((type) => ({
      productTypeId: type.productTypeId,
      typeName: type.typeName,
      count: countMap.get(type.productTypeId) || 0,
    }));
  }, [products, categoriesWithoutFilter, categoryId, keyword, allProductTypes]);

  // 獲取當前選中分類的名稱
  const selectedCategoryName = useMemo(() => {
    if (!categoryId) return undefined;
    const category = allProductTypes.find(
      (type) => type.productTypeId === categoryId
    );
    return category?.typeName;
  }, [categoryId, allProductTypes]);

  // 計算「全部商品」的數量
  const totalProductCount = useMemo(() => {
    if (categoryId && keyword) {
      // 有選擇分類時，使用不含分類篩選的總數
      return categoriesWithoutFilter.length;
    }
    return total;
  }, [categoryId, keyword, categoriesWithoutFilter, total]);

  // 處理價格篩選
  const handlePriceChange = (min: number | null, max: number | null) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  // 處理評價篩選
  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating);
  };

  // 處理分類篩選
  const handleCategoryChange = (newCategoryId: string | null) => {
    // 更新 URL 參數
    const newParams = new URLSearchParams(searchParams);
    if (newCategoryId) {
      newParams.set("category", newCategoryId);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams);
    // categoryId 會由 useEffect 同步更新
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
    // 清除 URL 中的分類參數
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    setSearchParams(newParams);
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
            categoryId={categoryId}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            totalProductCount={totalProductCount}
            showAllCategoryOption={!!keyword}
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
                  categoryId={categoryId}
                  onCategoryChange={handleCategoryChange}
                  categories={categories}
                  totalProductCount={totalProductCount}
                  showAllCategoryOption={!!keyword}
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
                <h1 className={styles.resultTitle}>
                  {keyword ? `搜尋結果：\"${keyword}\"` : "瀏覽商品"}
                </h1>
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
                <EmptyState keyword={keyword} categoryName={selectedCategoryName} />
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