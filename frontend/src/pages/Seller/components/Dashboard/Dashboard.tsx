import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartTypeSelector from './components/ChartTypeSelector';
import SalesChart from './components/SalesChart';
import SalesBarChart from './components/SalesBarChart';
import CategoryPieChart from './components/CategoryPieChart';
import PopularProductsList from './components/PopularProductsList';
import RecentOrdersList from './components/RecentOrdersList';
import { DateRangeFilter } from '@/shared/components/DateRangeFilter/DateRangeFilter';
import Button from '@/shared/components/Button';
import FormInput from '@/shared/components/FormInput';
import sellerService from '@/shared/services/sellerService';
import { DashboardData, SalesPeriod, ChartType, SellerDashboardFilters } from '@/types/seller';
import styles from './Dashboard.module.scss';

function Dashboard() {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [filters, setFilters] = useState<SellerDashboardFilters>({
    period: 'week',
    startDate: '',
    endDate: '',
    productName: '',
  });
  const [activeQuickSelector, setActiveQuickSelector] = useState<'day' | 'week' | 'month' | 'year' | null>(null);

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
      console.error('載入 Dashboard 資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof SellerDashboardFilters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setActiveQuickSelector(null);
    loadDashboardData(newFilters);
  };

  const handleQuickSelect = (period: 'day' | 'week' | 'month' | 'year') => {
    const { startDate, endDate } = calculateDateRange(period);
    const newFilters = { ...filters, period: undefined, startDate, endDate };
    setFilters(newFilters);
    setActiveQuickSelector(period);
    loadDashboardData(newFilters);
  };

  const calculateDateRange = (period: 'day' | 'week' | 'month' | 'year') => {
    const endDate = new Date().toISOString().split('T')[0];
    const start = new Date();
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setDate(start.getDate() - 30);
        break;
      case 'year':
        start.setDate(start.getDate() - 365);
        break;
    }
    return { startDate: start.toISOString().split('T')[0], endDate };
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await sellerService.downloadSalesReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        productName: filters.productName,
      });
    } catch (error) {
      console.error('下載報表失敗:', error);
      alert('下載報表失敗，請稍後再試');
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
          <ChartTypeSelector
            value={chartType}
            onChange={setChartType}
          />
          <Button
            variant="primary"
            icon="download"
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? '下載中...' : '下載銷售報表'}
          </Button>
        </div>

        <DateRangeFilter
          startDate={filters.startDate || ''}
          endDate={filters.endDate || ''}
          onStartDateChange={(date) => handleFilterChange('startDate', date)}
          onEndDateChange={(date) => handleFilterChange('endDate', date)}
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
            <div className={styles.statValue}>
              {dashboardData.orderCount}
            </div>
          </div>
        </div>

        {/* 圖表區 */}
        <div className={styles.chartContainer}>
          {chartType === 'line' && <SalesChart data={dashboardData.chartData} period={filters.period || 'week'} />}
          {chartType === 'bar' && <SalesBarChart data={dashboardData.chartData} period={filters.period || 'week'} />}
          {chartType === 'pie' && <CategoryPieChart data={dashboardData.categoryData} />}
        </div>
      </section>

      {/* 熱門商品排行 */}
      <section className={styles.section}>
        <h2>熱門商品排行</h2>
        <PopularProductsList
          products={dashboardData.popularProducts}
          onProductClick={(productId) => navigate(`/seller/product/edit/${productId}`)}
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
