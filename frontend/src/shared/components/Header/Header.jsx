import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import NavigationBar from "../NavigationBar/NavigationBar";
import Button from "../Button/Button";
import Icon from "../Icon/Icon";
import styles from "./Header.module.scss";

function Header({ isFixed = true }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Scroll effect
  useEffect(() => {
    if (!isFixed) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFixed]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`${styles.header} ${isFixed ? styles.fixed : ""} ${
        isScrolled ? styles.scrolled : ""
      }`}
    >
      <div className={styles.container}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <Link to="/">
              <img src="/RT-Mart_logo.png" />
            </Link>
          </div>

          {/* Right Section */}
          <div className={styles.rightSection}>
            {/* Search Icon */}
            <Button icon="search" iconOnly ariaLabel="Search" />

            {/* Cart Icon */}
            <Button
              icon="shopping-cart"
              iconOnly
              badge={0}
              ariaLabel="Shopping Cart"
            />

            {/* User Account / Login */}
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userButton}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User Menu"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className={styles.avatar} />
                  ) : (
                    <Icon icon="user" />
                  )}
                </button>
                {showUserMenu && (
                  <div className={styles.dropdown}>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>{user?.name}</p>
                      <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                    <div className={styles.divider} />
                    <button className={styles.dropdownItem} onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>
                      我的帳戶
                    </button>
                    <button className={styles.dropdownItem} onClick={() => { setShowUserMenu(false); navigate('/orders'); }}>
                      我的訂單
                    </button>
                    <div className={styles.divider} />
                    <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={handleLogout}>
                      <Icon icon="sign-out-alt" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="login">登入</Button>
              </Link>
            )}

            
          </div>
        </div>

        
      </div>
    </header>
  );
}

export default Header;
