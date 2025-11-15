import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  faSearch,
  faShoppingCart,
  faBars,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import NavigationBar from '../NavigationBar/NavigationBar';
import Button from '../Button/Button';
import styles from './Header.module.scss';

function Header({ isFixed = true }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header
      className={`${styles.header} ${isFixed ? styles.fixed : ""} ${
        isScrolled ? styles.scrolled : ""
      }`}
    >
      <div className={styles.container}>
        <div className={styles.navContainer}>
          {/* Logo Section */}
          <div className={styles.logo}>
            <Link to="/">
              <img src="/RT-Mart_logo.png"/>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavigationBar />

          {/* Right Section */}
          <div className={styles.rightSection}>
            {/* Search Icon */}
            <Button
              icon={faSearch}
              iconOnly
              ariaLabel="Search"
            />

            {/* Cart Icon */}
            <Button
              icon={faShoppingCart}
              iconOnly
              badge={0}
              ariaLabel="Shopping Cart"
            />

            {/* User Account / Login */}
            <Link to="/auth">
              <Button variant="login">
                登入
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              icon={isMobileMenuOpen ? faTimes : faBars}
              iconOnly
              onClick={toggleMobileMenu}
              className={styles.mobileMenuToggle}
              ariaLabel="Toggle Menu"
            />
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
