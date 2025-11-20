import { Link } from "react-router-dom";
import LanguageMenu from "./LanguageMenu";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import styles from "./HeaderC.module.scss";

/**
 * HeaderC Component
 * 賣家中心/管理員後台專用導航列
 * 包含：常見問題、語言切換、使用者選單
 * 不包含：賣家中心連結、搜尋欄、購物車
 */
function HeaderC() {
  return (
    <header className={styles.headerC}>
      {/* Top Bar - 簡化版（無賣家中心連結） */}
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.topBarLinks}>
            {/* FAQ Link */}
            <Link to="/faq" className={styles.link}>
              常見問題
            </Link>

            {/* Language Menu */}
            <LanguageMenu variant="topbar" />
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className={styles.mainBar}>
        <div className={styles.container}>
          <div className={styles.mainBarContent}>
            {/* Logo */}
            <Logo variant="with-text" />

            <div className={styles.spacer}></div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderC;
