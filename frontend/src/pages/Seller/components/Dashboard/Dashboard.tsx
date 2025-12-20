import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesPeriodSelector from './SalesPeriodSelector';
import ChartTypeSelector from './ChartTypeSelector';
import SalesChart from './SalesChart';
import SalesBarChart from './SalesBarChart';
import CategoryPieChart from './CategoryPieChart';
import PopularProductsList from './PopularProductsList';
import RecentOrdersList from './RecentOrdersList';
import sellerService from '@/shared/services/sellerService';
import { DashboardData, SalesPeriod, ChartType } from '@/types/seller';
import styles from './Dashboard.module.scss';

function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<SalesPeriod>('week');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await sellerService.getDashboardData(period);
      setDashboardData(data);
    } catch (error) {
      console.error('載入 Dashboard 資料失敗:', error);
    } finally {
      setLoading(false);
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

      {/* 營業概況 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>營業概況</h2>
          <div className={styles.selectors}>
            <SalesPeriodSelector
              value={period}
              onChange={setPeriod}
            />
            <ChartTypeSelector
              value={chartType}
              onChange={setChartType}
            />
          </div>
        </div>

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
          {chartType === 'line' && <SalesChart data={dashboardData.chartData} period={period} />}
          {chartType === 'bar' && <SalesBarChart data={dashboardData.chartData} period={period} />}
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
