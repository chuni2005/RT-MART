import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import Button from "../Button/Button";
import Icon from "../Icon/Icon";
import styles from "./UserMenu.module.scss";

/**
 * UserMenu Component
 * 顯示用戶選單或登入按鈕
 * - 已驗證用戶：顯示頭像和下拉選單
 * - 未驗證用戶：顯示登入按鈕
 */
const UserMenu = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error("登出失敗:", error);
      alert("登出失敗，請稍後再試");
    }
  };

  if (!isAuthenticated) {
    return (
      <Link to="/auth">
        <Button variant="login" fullWidth>登入</Button>
      </Link>
    );
  }

  return (
    <div className={styles.userMenu}>
      <Button
        iconOnly={!user?.avatar}
        icon={user?.avatar ? undefined : "user"}
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={styles.userButton}
        ariaLabel="用戶選單"
      >
        {user?.avatar && (
          <img src={user.avatar} alt={user.name} className={styles.avatar} />
        )}
      </Button>

      {showUserMenu && (
        <div className={styles.dropdown}>
          {/* User Info Section */}
          <div className={styles.userInfo}>
            <div className={styles.userInfoRow}>
              <Icon icon="user" />
              <span>{user?.loginId || user?.name}</span>
            </div>
            <div className={styles.userInfoRow}>
              <Icon icon="envelope" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Account Link */}
          <Link
            to="/user/account/profile"
            onClick={() => setShowUserMenu(false)}
            className={styles.dropdownItem}
          >
            我的帳戶
          </Link>

          {/* Orders Link */}
          <Link
            to="/user/orders"
            onClick={() => setShowUserMenu(false)}
            className={styles.dropdownItem}
          >
            我的訂單
          </Link>

          <div className={styles.divider} />

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            fullWidth
            className={`${styles.dropdownItem} ${styles.logout}`}
          >
            登出
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
