import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * ProtectedRoute Component
 * 保護需要登入才能訪問的路由
 *
 * @param children - 受保護的子組件
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 載入中顯示
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <p>載入中...</p>
      </div>
    );
  }

  // 未登入則導向登入頁面
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default ProtectedRoute;
