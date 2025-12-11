import { useState } from "react";
import Select from "../Select/Select";
import { LanguageMenuProps } from "@/types/common";
import styles from "./LanguageMenu.module.scss";

/**
 * LanguageMenu Component
 * 使用 Select 組件實作的語言選單
 * 支援繁體中文 (zh-TW) 和英文 (en)
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
  const [language, setLanguage] = useState("zh-TW");

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // TODO: 實作 i18n 國際化切換
    console.log("切換語言至:", newLanguage);
  };

  return (
    <Select
      options={languages}
      value={language}
      onChange={handleLanguageChange}
      variant={variant}
      icon="globe"
      ariaLabel="選擇語言"
      classNames={{
        prefixIcon: className || classNames?.icon || styles.icon,
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
