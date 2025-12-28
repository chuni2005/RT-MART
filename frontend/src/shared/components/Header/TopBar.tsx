import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import LanguageMenu from "./LanguageMenu";
import Dialog from "../Dialog";
import Button from "../Button";
import styles from "./TopBar.module.scss";

/**
 * TopBar Component
 * 頁首頂部導航列
 * 包含：賣家中心、常見問題、語言切換
 */
const TopBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  // 處理賣家中心點擊事件
  const handleSellerCenterClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      // 未登入：導向登入頁
      navigate('/auth', { state: { from: '/seller/center' } });
      return;
    }

    if (user?.role === 'buyer') {
      // Buyer：顯示申請對話框（停留在當前頁面）
      setShowApplyDialog(true);
      return;
    }

    if (user?.role === 'seller') {
      // Seller：直接導向賣家中心
      navigate('/seller/center');
      return;
    }
  };

  return (
    <>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.topBarLinks}>
            {/* Seller Center Link */}
            <a
              href="/seller/center"
              className={styles.link}
              onClick={handleSellerCenterClick}
            >
              賣家中心
            </a>

            {/* FAQ Link */}
            <Link to="/faq" className={styles.link}>
              常見問題
            </Link>

            {/* Language Menu */}
            <LanguageMenu variant="topbar" />
          </div>
        </div>
      </div>

      {/* 申請成為賣家對話框 */}
      <Dialog
        type="custom"
        isOpen={showApplyDialog}
        onClose={() => setShowApplyDialog(false)}
        title="成為賣家"
      >
        <div className={styles.applyDialog}>
          <p>您尚未成為賣家，需要申請成為賣家才能使用此功能。</p>
          <div className={styles.dialogActions}>
            <Button
              variant="outline"
              onClick={() => setShowApplyDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setShowApplyDialog(false);
                navigate("/seller/apply");
              }}
            >
              立即申請
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default TopBar;
