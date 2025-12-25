import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import type { ProtectedRouteProps } from '@/types/common';

/**
 * ProtectedRoute Component
 * 保護需要登入才能訪問的路由，可選擇性地限制特定角色
 *
 * @param children - 受保護的子組件
 * @param requiredRole - 可選的必要角色，如果指定則只有該角色可訪問
 * @param excludeRoles - 排除的角色列表，這些角色無法訪問
 */
function ProtectedRoute({ children, requiredRole, excludeRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // 排除角色檢查（優先）
  if (excludeRoles && user?.role && excludeRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 必需角色檢查
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
