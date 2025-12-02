/**
 * FormInput Component - 可複用的表單輸入組件
 * 支援：錯誤顯示、密碼可見性切換、圖示
 */

import { useState, ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Icon from '../Icon/Icon';
import styles from './FormInput.module.scss';

interface FormInputProps {
  label?: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  icon?: IconProp | string;
  className?: string;
  [key: string]: any;
}

const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  autoComplete,
  required = false,
  icon,
  className,
  ...rest
}: FormInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  // 切換密碼可見性
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // 判斷是否為密碼欄位
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className={`${styles.formGroup} ${className || ""}`}>
      {/* Label */}
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}

      <div className={styles.inputContainer}>
        {icon && (
          <div className={styles.icon}>
            <Icon icon={icon} />
          </div>
        )}

        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`${styles.input} ${error ? styles.error : ""} ${
            icon ? styles.hasIcon : ""
          } ${isPasswordField ? styles.hasPasswordToggle : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
          {...rest}
        />

        {isPasswordField && (
          <div
            className={styles.passwordToggle}
            onClick={togglePasswordVisibility}
            role="button"
            tabIndex={0}
            aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePasswordVisibility();
              }
            }}
          >
            <Icon icon={showPassword ? "eye" : "eye-slash"} />
          </div>
        )}
      </div>

      {error && (
        <div id={`${name}-error`} className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormInput;
