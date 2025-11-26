import { Link } from "react-router-dom";
import styles from "./Logo.module.scss";

interface LogoProps {
  variant?: "default" | "with-text";
  to?: string;
}

/**
 * Logo Component
 * 可重用的 Logo 組件，支援兩種變體：
 * - "default": 僅圖片（用於 HeaderB）
 * - "with-text": 圖片 + 文字（用於 HeaderA, HeaderC）
 */
function Logo({ variant = "with-text", to = "/" }: LogoProps) {
  return (
    <Link to={to} className={styles.logo}>
      <img src="/RT-Mart-favicon.png" alt="RT-MART" />
      {variant === "with-text" && <span className={styles.text}>RT-MART</span>}
    </Link>
  );
}

export default Logo;
