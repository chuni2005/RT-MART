import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import AdminSidebar from './components/AdminSidebar';
import Button from '@/shared/components/Button';
import styles from './AdminCenter.module.scss';

/**
 * Admin Center Layout - 管理員中心主布局
 * 左側導航欄 + 右側主內容區
 * 包含權限檢查邏輯
 */
function AdminCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 權限檢查：只有 admin 可以訪問
  if (user?.role !== 'admin') {
    return (
      <div className={styles.accessDenied}>
        <h2>無權訪問</h2>
        <p>此頁面僅限管理員訪問。</p>
        <Button onClick={() => navigate('/')}>返回首頁</Button>
      </div>
    );
  }

  return (
    <div className={styles.adminCenter}>
      {/* 左側導航欄 */}
      <AdminSidebar activeRoute={location.pathname} />

      {/* 右側主內容區 */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminCenter;
