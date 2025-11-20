import { Link } from "react-router-dom";
import LanguageMenu from "./LanguageMenu";
import styles from "./TopBar.module.scss";

/**
 * TopBar Component
 * 頁首頂部導航列
 * 包含：賣家中心、常見問題、語言切換
 */
const TopBar = () => {
  return (
    <div className={styles.topBar}>
      <div className={styles.container}>
        <div className={styles.topBarLinks}>
          {/* Seller Center Link */}
          <Link to="/seller/center" className={styles.link}>
            賣家中心
          </Link>

          {/* FAQ Link */}
          <Link to="/faq" className={styles.link}>
            常見問題
          </Link>

          {/* Language Menu */}
          <LanguageMenu variant="topbar" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
