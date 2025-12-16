import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import SellerSidebar from './components/SellerSidebar';
import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import styles from './SellerCenter.module.scss';

/**
 * Seller Center Layout - 賣家中心主布局
 * 左側導航欄 + 右側主內容區
 * 包含權限檢查邏輯
 */
function SellerCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  // 權限檢查：buyer 彈出申請成為賣家對話框
  useEffect(() => {
    if (user && user.role === 'buyer') {
      setShowApplyDialog(true);
    }
  }, [user]);

  // 管理員無權訪問賣家中心
  if (user?.role === 'admin') {
    return (
      <div className={styles.accessDenied}>
        <h2>無權訪問</h2>
        <p>管理員帳號無法訪問賣家中心。</p>
        <Button onClick={() => navigate('/')}>
          返回首頁
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sellerCenter}>
        {/* 左側導航欄 */}
        <SellerSidebar activeRoute={location.pathname} />

        {/* 右側主內容區 */}
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {/* 申請成為賣家對話框 */}
      <Dialog
        isOpen={showApplyDialog}
        onClose={() => {
          setShowApplyDialog(false);
          navigate('/');
        }}
        title="成為賣家"
      >
        <div className={styles.applyDialog}>
          <p>您尚未成為賣家，需要申請成為賣家才能使用此功能。</p>
          <div className={styles.dialogActions}>
            <Button
              variant="outline"
              onClick={() => {
                setShowApplyDialog(false);
                navigate('/');
              }}
            >
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 跳轉到申請頁面
              alert('申請成為賣家功能尚未實作');
              setShowApplyDialog(false);
              navigate('/');
            }}>
              立即申請
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default SellerCenter;
