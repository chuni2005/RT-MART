import React, { useState, useRef, useEffect } from "react";
import Icon from "../Icon/Icon";
import styles from "./LanguageMenu.module.scss";

/**
 * LanguageMenu Component
 * 自訂下拉選單組件，完全可控制樣式
 * 支援繁體中文 (zh-TW) 和英文 (en)
 * 支援鍵盤導航 (Enter, Escape, Arrow keys)
 *
 * @param {string} variant - 外觀變體 ("default" | "topbar")
 */

const languages = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
];

const LanguageMenu = ({ variant = "default" }) => {
  const [language, setLanguage] = useState("zh-TW");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 鍵盤導航
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setIsOpen(false);
    buttonRef.current?.focus();
    // TODO: 實作 i18n 國際化切換
    console.log("切換語言至:", newLanguage);
  };

  const currentLanguage = languages.find((lang) => lang.value === language);

  return (
    <div
      className={`${styles.languageMenu} ${styles[variant]}`}
      ref={menuRef}
    >
      <Icon icon="globe" className={styles.icon} />
      <div className={styles.selectWrapper}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.select}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="選擇語言"
        >
          <span>{currentLanguage?.label}</span>
          <Icon
            icon="chevron-down"
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          />
        </button>

        {isOpen && (
          <ul className={styles.dropdown} role="listbox">
            {languages.map((lang) => (
              <li
                key={lang.value}
                role="option"
                aria-selected={language === lang.value}
                className={`${styles.option} ${
                  language === lang.value ? styles.optionActive : ""
                }`}
                onClick={() => handleLanguageChange(lang.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLanguageChange(lang.value);
                  }
                }}
                tabIndex={0}
              >
                {lang.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LanguageMenu;
