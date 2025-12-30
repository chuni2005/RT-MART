import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useCart } from "@/shared/contexts/CartContext";
import TopBar from "./TopBar";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import styles from "./HeaderA.module.scss";
import Button from "../Button";

function HeaderA() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  // Hide cart icon on cart and checkout pages
  const hideCartIcon = ["/cart", "/checkout"].includes(location.pathname);

  // Handle cart button click with auth check
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/cart' } });
      return;
    }

    navigate('/cart');
  };

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
                <Button
                  onClick={handleCartClick}
                  className={styles.cartButton}
                  aria-label="購物車"
                  icon="shopping-cart"
                >
                  <span className={styles.badge}>{itemCount}</span>
                </Button>
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
