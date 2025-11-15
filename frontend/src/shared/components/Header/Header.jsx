import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faShoppingCart,
  faUser,
  faBars,
  faTimes,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import NavigationBar from '../NavigationBar/NavigationBar';
import styles from './Header.module.scss';

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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFixed]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header
      className={`${styles.header} ${isFixed ? styles.fixed : ''} ${
        isScrolled ? styles.scrolled : ''
      }`}
    >
      <div className={styles.container}>
        <div className={styles.navContainer}>
          {/* Logo Section */}
          <div className={styles.logo}>
            <Link to="/">
              <img src='/public/RT-MART_logo.png' className={styles.logoPic}></img>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavigationBar />

          {/* Right Section */}
          <div className={styles.rightSection}>
            {/* Search Icon */}
            <button className={styles.iconButton} aria-label="Search">
              <FontAwesomeIcon icon={faSearch} />
            </button>

            {/* Cart Icon */}
            <button className={styles.iconButton} aria-label="Shopping Cart">
              <FontAwesomeIcon icon={faShoppingCart} />
              <span className={styles.badge}>0</span>
            </button>

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
                    <FontAwesomeIcon icon={faUser} />
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
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className={styles.loginButton}>
                登入
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className={styles.mobileMenuToggle}
              onClick={toggleMobileMenu}
              aria-label="Toggle Menu"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <nav>
              <ul>
                <li>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    首頁
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    商品
                  </Link>
                </li>
                <li>
                  <Link
                    to="/categories"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    分類
                  </Link>
                </li>
                <li>
                  <Link to="/deals" onClick={() => setIsMobileMenuOpen(false)}>
                    優惠活動
                  </Link>
                </li>
                <li>
                  <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>
                    關於我們
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
