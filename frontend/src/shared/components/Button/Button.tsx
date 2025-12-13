import Icon from '../Icon';
import styles from './Button.module.scss';
import type { ButtonProps } from '@/types';

function Button({
  variant = 'primary',
  size = 'md',
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
      case 'ghost':
        return styles.btnGhost;
      default:
        return styles.btnPrimary;
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return styles.btnSmall;
      case 'lg':
        return styles.btnLarge;
      case 'md':
      default:
        return styles.btnMedium;
    }
  };

  const buttonClasses = [
    styles.btn,
    getVariantClass(),
    !iconOnly && getSizeClass(),
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
