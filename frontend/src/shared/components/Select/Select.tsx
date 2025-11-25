/**
 * Select Component - 可複用的下拉選單組件
 * 支援：自訂圖示、鍵盤導航、點擊外部關閉、無障礙支援
 */

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Icon from '../Icon/Icon';
import styles from './Select.module.scss';
import type { SelectProps } from '@/types';

const Select = ({
  options = [],
  value,
  onChange,
  variant = 'default',
  placeholder = '請選擇',
  icon = null,
  ariaLabel,
  disabled = false,
  className = '',
  classNames = {},
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 解構 classNames，提供各元素的自定義樣式
  const {
    container: customContainer = '',
    prefixIcon: customPrefixIcon = '',
    trigger: customTrigger = '',
    value: customValue = '',
    chevron: customChevron = '',
    dropdown: customDropdown = '',
    option: customOption = '',
    optionActive: customOptionActive = '',
    optionFocused: customOptionFocused = '',
  } = classNames;

  // 取得目前選中的選項
  const selectedOption = options.find((opt) => opt.value === value);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 開啟選單時，設定焦點索引
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, options, value]);

  // 選擇選項
  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  // 切換下拉選單
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  // 鍵盤導航
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value);
        } else {
          setIsOpen((prev) => !prev);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;

      default:
        break;
    }
  };

  // 渲染圖示 (支援 string 或 icon object)
  const renderIcon = (iconProp: IconProp | string) => {
    if (!iconProp) return null;
    return <Icon icon={iconProp} className={styles.icon} />;
  };

  // 組合 class names
  const containerClasses = [
    styles.select,
    styles[variant],
    disabled && styles.disabled,
    isOpen && styles.open,
    className,
    customContainer,
  ]
    .filter(Boolean)
    .join(' ');

  const triggerClasses = [styles.trigger, customTrigger].filter(Boolean).join(' ');
  const valueClasses = [styles.value, customValue].filter(Boolean).join(' ');
  const chevronClasses = [
    styles.chevron,
    isOpen && styles.chevronOpen,
    customChevron,
  ].filter(Boolean).join(' ');
  const dropdownClasses = [styles.dropdown, customDropdown].filter(Boolean).join(' ');
  const prefixIconClasses = [styles.prefixIcon, customPrefixIcon].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* 前置圖示 */}
      {icon && <div className={prefixIconClasses}>{renderIcon(icon)}</div>}

      {/* 選擇按鈕 */}
      <button
        ref={buttonRef}
        type="button"
        className={triggerClasses}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
      >
        <span className={valueClasses}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          icon="chevron-down"
          className={chevronClasses}
        />
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <ul
          ref={listRef}
          className={dropdownClasses}
          role="listbox"
          aria-activedescendant={
            focusedIndex >= 0 ? `option-${options[focusedIndex]?.value}` : undefined
          }
        >
          {options.map((option, index) => {
            const optionClasses = [
              styles.option,
              customOption,
              value === option.value && styles.optionActive,
              value === option.value && customOptionActive,
              focusedIndex === index && styles.optionFocused,
              focusedIndex === index && customOptionFocused,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li
                key={option.value}
                id={`option-${option.value}`}
                role="option"
                aria-selected={value === option.value}
                className={optionClasses}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
