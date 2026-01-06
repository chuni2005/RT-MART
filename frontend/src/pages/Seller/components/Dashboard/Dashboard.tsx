import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChartTypeSelector from "./components/ChartTypeSelector";
import SalesChart from "./components/SalesChart";
import SalesBarChart from "./components/SalesBarChart";
import CategoryPieChart from "./components/CategoryPieChart";
import PopularProductsList from "./components/PopularProductsList";
import RecentOrdersList from "./components/RecentOrdersList";
import { DateRangeFilter } from "@/shared/components/DateRangeFilter/DateRangeFilter";
import Button from "@/shared/components/Button";
import sellerService from "@/shared/services/sellerService";
import { calculateDateRangeLocal } from "@/shared/utils/dateUtils";
import {
  DashboardData,
  SalesPeriod,
  ChartType,
  SellerDashboardFilters,
} from "@/types/seller";
import styles from "./Dashboard.module.scss";

function Dashboard() {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<ChartType>("line");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [filters, setFilters] = useState<SellerDashboardFilters>({
    period: "week",
    startDate: "",
    endDate: "",
    productName: "",
  });
  const [activeQuickSelector, setActiveQuickSelector] = useState<
    "day" | "week" | "month" | "year" | null
  >(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (customFilters?: SellerDashboardFilters) => {
    setLoading(true);
    try {
      const filterParams = customFilters || filters;
      const data = await sellerService.getDashboardData(filterParams);
      setDashboardData(data);
    } catch (error) {
      console.error("載入 Dashboard 資料失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    field: keyof SellerDashboardFilters,
    value: string
  ) => {
    const newFilters = { ...filters, [field]: value };

    // 如果開始或結束日期有變動，自動計算最適合的 period
    if (
      (field === "startDate" || field === "endDate") &&
      newFilters.startDate &&
      newFilters.endDate
    ) {
      const start = new Date(newFilters.startDate);
      const end = new Date(newFilters.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        newFilters.period = "month"; // 以「天」為單位顯示
      } else if (diffDays < 365) {
        newFilters.period = "year"; // 以「月」為單位顯示
      } else {
        // 這裡我們擴充一個 'all' 或沿用 'year'，但後端需要支援跨年
        newFilters.period = "year";
      }
    }

    setFilters(newFilters);
    setActiveQuickSelector(null);
    loadDashboardData(newFilters);
  };

  const handleQuickSelect = (period: "day" | "week" | "month" | "year") => {
    const { startDate, endDate } = calculateDateRangeLocal(period);
    const newFilters = {
      ...filters,
      period: period as SalesPeriod,
      startDate,
      endDate,
    };
    setFilters(newFilters);
    setActiveQuickSelector(period);
    loadDashboardData(newFilters);
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await sellerService.downloadSalesReport({
        period: filters.period,
        startDate: filters.startDate,
        endDate: filters.endDate,
        productName: filters.productName,
      });
    } catch (error) {
      console.error("下載報表失敗:", error);
      alert("下載報表失敗，請稍後再試");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  if (!dashboardData) {
    return <div className={styles.error}>載入失敗</div>;
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.topRow}>
          <ChartTypeSelector value={chartType} onChange={setChartType} />
          <Button
            variant="primary"
            icon="download"
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? "下載中..." : "下載銷售報表"}
          </Button>
        </div>

        <DateRangeFilter
          startDate={filters.startDate || ""}
          endDate={filters.endDate || ""}
          onStartDateChange={(date) => handleFilterChange("startDate", date)}
          onEndDateChange={(date) => handleFilterChange("endDate", date)}
          showQuickSelectors={true}
          onQuickSelect={handleQuickSelect}
          activeQuickSelector={activeQuickSelector}
        />
      </div>

      {/* 營業概況 */}
      <section className={styles.section}>
        <h2>營業概況</h2>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>營業額</div>
            <div className={styles.statValue}>
              NT$ {dashboardData.revenue.toLocaleString()}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>訂單數</div>
            <div className={styles.statValue}>{dashboardData.orderCount}</div>
          </div>
        </div>

        {/* 圖表區 */}
        <div className={styles.chartContainer}>
          {chartType === "line" && (
            <SalesChart
              data={dashboardData.chartData}
              period={filters.period || "week"}
            />
          )}
          {chartType === "bar" && (
            <SalesBarChart
              data={dashboardData.chartData}
              period={filters.period || "week"}
            />
          )}
          {chartType === "pie" && (
            <CategoryPieChart data={dashboardData.categoryData} />
          )}
        </div>
      </section>

      {/* 熱門商品排行 */}
      <section className={styles.section}>
        <h2>熱門商品排行</h2>
        <PopularProductsList
          products={dashboardData.popularProducts}
          onProductClick={(productId) =>
            navigate(`/seller/product/edit/${productId}`)
          }
        />
      </section>

      {/* 最近訂單 */}
      <section className={styles.section}>
        <h2>最近訂單</h2>
        <RecentOrdersList
          orders={dashboardData.recentOrders}
          onOrderClick={(orderId) => navigate(`/seller/order/${orderId}`)}
        />
      </section>
    </div>
  );
}

export default Dashboard;
