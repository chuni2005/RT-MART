import { Outlet, useLocation } from 'react-router-dom';
import UserSidebar from './components/UserSidebar';
import styles from './UserCenter.module.scss';

/**
 * User Layout - 使用者中心主布局
 * 左側導航欄 + 右側主內容區
 */
function UserCenter() {
  const location = useLocation();

  return (
    <div className={styles.userCenter}>
      {/* 左側導航欄 */}
      <UserSidebar activeRoute={location.pathname} />

      {/* 右側主內容區 */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default UserCenter;