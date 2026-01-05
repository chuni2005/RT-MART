import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Select from "../Select/Select";
import { LanguageMenuProps } from "@/types/common";
import styles from "./LanguageMenu.module.scss";

/**
 * LanguageMenu Component
 * 使用 Select 組件實作的語言選單
 * 支援繁體中文 (zh) 和英文 (en)
 *
 * @param variant - 外觀變體 ("default" | "topbar")
 */

const languages = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
];
const LanguageMenu = ({
  variant = "default",
  className,
  classNames
}: LanguageMenuProps) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState("zh-TW");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "zh-TW";
    setLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
  }, []);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    document.documentElement.lang = newLanguage;
  };

  return (
    <Select
      options={languages}
      value={language}
      onChange={handleLanguageChange}
      variant={variant}
      icon="globe"
      ariaLabel="選擇語言"
      className={className}
      classNames={{
        prefixIcon: classNames?.icon || styles.icon,
        trigger: classNames?.trigger || styles.trigger,
        chevron: classNames?.chevron || styles.chevron,
        dropdown: classNames?.dropdown || styles.dropdown,
        option: classNames?.option || styles.option,
        optionActive: classNames?.optionActive || styles.optionActive,
      }}
    />
  );
};

export default LanguageMenu;
