import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../Button/Button";
import styles from "./SearchBar.module.scss";

interface SearchBarProps {
  type?: string;
  placeholder?: string;
  onSearch?: (keyword: string, type: string) => void;
}

/**
 * SearchBar Component
 * 可重用的搜尋列組件，支援自定義搜尋類型和 API
 *
 * @param type - 搜尋類型 (預設: "products")，例如 "products", "stores", "orders"
 * @param placeholder - 輸入框的 placeholder 文字
 * @param onSearch - 可選的自定義搜尋處理函數 (keyword, type) => void
 */
const SearchBar = ({
  type = "products",
  placeholder = "搜尋商品",
  onSearch
}: SearchBarProps) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const keyword = searchKeyword.trim();

    if (!keyword) return;

    // 如果提供自定義處理函數，使用它
    if (onSearch) {
      onSearch(keyword, type);
      return;
    }

    // 預設行為：導航到搜尋頁面，帶上 type 和 keyword 參數
    navigate(`/search?type=${encodeURIComponent(type)}&q=${encodeURIComponent(keyword)}`);
  };

  return (
    <form onSubmit={handleSearch} className={styles.searchForm}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className={styles.searchInput}
      />
      <Button
        type="submit"
        iconOnly
        icon="search"
        className={styles.searchButton}
        ariaLabel="搜尋"
      />
    </form>
  );
};

export default SearchBar;
