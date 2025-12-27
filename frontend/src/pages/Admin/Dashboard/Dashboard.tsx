import { useState, useEffect } from 'react';
import Icon from '@/shared/components/Icon';
import adminService from '@/shared/services/adminService.index';
import { DashboardStats } from '@/types/admin';
import RevenueLineChart from './components/RevenueLineChart';
import UserGrowthBarChart from './components/UserGrowthBarChart';
import OrderStatusPieChart from './components/OrderStatusPieChart';
import styles from './Dashboard.module.scss';

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('載入 Dashboard 數據失敗:', error);
    } finally {
      setLoading(false);
    }
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
            <div className={styles.statLabel}>活躍賣家數</div>
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
