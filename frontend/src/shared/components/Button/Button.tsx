import { ReactNode, CSSProperties, MouseEvent } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Icon from '../Icon/Icon';
import styles from './Button.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'outline' | 'login';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: IconProp | null;
  iconOnly?: boolean;
  badge?: string | number | null;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

function Button({
  variant = 'primary',
  onClick,
  children,
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon = null,
  iconOnly = false,
  badge = null,
  className = '',
  style = {},
  ariaLabel,
}: ButtonProps) {
  const getVariantClass = () => {
    if (iconOnly) return styles.iconButton;
    switch (variant) {
      case 'primary':
        return styles.btnPrimary;
      case 'outline':
        return styles.btnOutline;
      case 'login':
        return styles.btnLogin;
      default:
        return styles.btnPrimary;
    }
  };

  const buttonClasses = [
    styles.btn,
    getVariantClass(),
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      style={style}
      aria-label={ariaLabel}
    >
      {icon && <Icon icon={icon} />}
      {!iconOnly && children}
      {badge !== null && <span className={styles.badge}>{badge}</span>}
    </button>
  );
}

export default Button;
