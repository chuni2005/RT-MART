import { Link, useLocation } from "react-router-dom";
import Icon from "../Icon/Icon";
import TopBar from "./TopBar";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import styles from "./HeaderA.module.scss";

function HeaderA() {
  const location = useLocation();

  // Hide cart icon on cart and checkout pages
  const hideCartIcon = ["/cart", "/checkout"].includes(location.pathname);

  return (
    <header className={styles.headerA}>
      {/* Top Navigation Bar */}
      <TopBar />

      {/* Main Navigation Bar */}
      <div className={styles.mainBar}>
        <div className={styles.container}>
          <div className={styles.mainBarContent}>
            {/* Logo */}
            <Logo variant="with-text" />

            {/* Search Bar */}
            <SearchBar type="products" placeholder="搜尋商品" />

            {/* Right Section */}
            <div className={styles.rightSection}>
              {/* Shopping Cart */}
              {!hideCartIcon && (
                <Link to="/cart" className={styles.cartButton}>
                  <Icon icon="shopping-cart" />
                  {/* TODO: Replace with actual cart count */}
                  <span className={styles.badge}>0</span>
                </Link>
              )}

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderA;
