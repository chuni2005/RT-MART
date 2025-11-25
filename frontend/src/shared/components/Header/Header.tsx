import HeaderA from "./HeaderA";
import HeaderB from "./HeaderB";
import HeaderC from "./HeaderC";

interface HeaderProps {
  variant?: "main" | "simple" | "admin";
}

/**
 * Header Component
 * 根據 variant 選擇不同的 Header 樣式
 *
 * @param variant - Header 變體
 *   - "main" (default): 主站導航列（搜尋欄、購物車、用戶選單）
 *   - "simple": 簡單導航列（Logo + 語言切換）
 *   - "admin": 賣家中心/管理員後台導航列
 */
function Header({ variant = "main" }: HeaderProps) {
  switch (variant) {
    case "simple":
      return <HeaderB />;
    case "admin":
      return <HeaderC />;
    case "main":
    default:
      return <HeaderA />;
  }
}

export default Header;
