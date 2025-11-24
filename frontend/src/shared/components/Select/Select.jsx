/**
 * Select Component - 可複用的下拉選單組件
 * 支援：自訂圖示、鍵盤導航、點擊外部關閉、無障礙支援
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon/Icon';
import styles from './Select.module.scss';

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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  // 取得目前選中的選項
  const selectedOption = options.find((opt) => opt.value === value);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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
    (optionValue) => {
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
  const handleKeyDown = (e) => {
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
  const renderIcon = (iconProp) => {
    if (!iconProp) return null;
    if (typeof iconProp === 'string') {
      return <Icon icon={iconProp} className={styles.icon} />;
    }
    return <Icon icon={iconProp} className={styles.icon} />;
  };

  // 組合 class names
  const containerClasses = [
    styles.select,
    styles[variant],
    disabled && styles.disabled,
    isOpen && styles.open,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* 前置圖示 */}
      {icon && <div className={styles.prefixIcon}>{renderIcon(icon)}</div>}

      {/* 選擇按鈕 */}
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
      >
        <span className={styles.value}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          icon="chevron-down"
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <ul
          ref={listRef}
          className={styles.dropdown}
          role="listbox"
          aria-activedescendant={
            focusedIndex >= 0 ? `option-${options[focusedIndex]?.value}` : undefined
          }
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`option-${option.value}`}
              role="option"
              aria-selected={value === option.value}
              className={`${styles.option} ${
                value === option.value ? styles.optionActive : ''
              } ${focusedIndex === index ? styles.optionFocused : ''}`}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'compact', 'topbar']),
  placeholder: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.array]),
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Select;
