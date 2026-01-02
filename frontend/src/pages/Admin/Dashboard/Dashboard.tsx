import { useState, useEffect } from 'react';
import Icon from '@/shared/components/Icon';
import adminService from '@/shared/services/adminService.index';
import { DashboardStats, DashboardFilters } from '@/types/admin';
import { DateRangeFilter } from '@/shared/components/DateRangeFilter/DateRangeFilter';
import RevenueLineChart from './components/RevenueLineChart';
import UserGrowthBarChart from './components/UserGrowthBarChart';
import OrderStatusPieChart from './components/OrderStatusPieChart';
import styles from './Dashboard.module.scss';

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize filters with default date range (last 30 days)
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
  });
  const [activeQuickSelector, setActiveQuickSelector] = useState<'day' | 'week' | 'month' | 'year' | null>('month');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (customFilters?: DashboardFilters) => {
    setLoading(true);
    try {
      const filterParams = customFilters || filters;
      const data = await adminService.getDashboardStats(filterParams);
      setStats(data);
    } catch (error) {
      console.error('載入 Dashboard 數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof DashboardFilters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setActiveQuickSelector(null); // Clear quick selector when manually changing dates
    loadDashboardData(newFilters);
  };

  const handleQuickSelect = (period: 'day' | 'week' | 'month' | 'year') => {
    const { startDate, endDate } = calculateDateRange(period);
    const newFilters = { ...filters, startDate, endDate };
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

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      seller_application: 'house-circle-check',
      product_review: 'box-open',
      dispute: 'bolt',
    };
    return iconMap[type] || 'info-circle';
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  if (!stats) {
    return <div className={styles.error}>載入失敗</div>;
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>管理員首頁</h1>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} data-color="blue">
          <div className={styles.statIcon}>
            <Icon icon="dollar-sign" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>平台總交易額</div>
            <div className={styles.statValue}>NT$ {stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.statCard} data-color="green">
          <div className={styles.statIcon}>
            <Icon icon="users" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>註冊使用者數</div>
            <div className={styles.statValue}>{stats.totalUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.statCard} data-color="purple">
          <div className={styles.statIcon}>
            <Icon icon="store" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>注冊賣家數</div>
            <div className={styles.statValue}>{stats.activeSellers.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.statCard} data-color="orange">
          <div className={styles.statIcon}>
            <Icon icon="clipboard-list" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>待審核項目</div>
            <div className={styles.statValue}>{stats.pendingReviews.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        <h2 className={styles.sectionTitle}>平台數據趨勢</h2>

        <div className={styles.chartsGrid}>
          {/* Revenue Line Chart */}
          <div className={styles.chartCard}>
            <RevenueLineChart data={stats.revenueChartData} />
          </div>

          {/* User Growth Bar Chart */}
          <div className={styles.chartCard}>
            <UserGrowthBarChart data={stats.userGrowthChartData} />
          </div>

          {/* Order Status Pie Chart */}
          <div className={styles.chartCard}>
            <OrderStatusPieChart data={stats.orderStatusChartData} />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className={styles.recentActivities}>
        <h2 className={styles.sectionTitle}>最近活動</h2>
        <div className={styles.activitiesList}>
          {stats.recentActivities.map((activity) => (
            <div key={activity.id} className={styles.activityCard}>
              <div className={styles.activityIcon}>
                <Icon icon={getActivityIcon(activity.type)} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityMessage}>
                  {activity.message}
                  <span className={styles.activityCount}>{activity.count}</span>
                </div>
                <div className={styles.activityTime}>{activity.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
