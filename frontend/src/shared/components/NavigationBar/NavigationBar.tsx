import { Link, useLocation } from 'react-router-dom';
import styles from './NavigationBar.module.scss';

interface NavItem {
  path: string;
  label: string;
}

function NavigationBar() {
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/', label: '首頁' },
    { path: '/products', label: '商品' },
    { path: '/categories', label: '分類' },
    { path: '/deals', label: '優惠活動' },
    { path: '/about', label: '關於我們' },
  ];

  return (
    <nav className={styles.navigationBar}>
      <ul className={styles.navMenu}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? styles.active : ''}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavigationBar;
