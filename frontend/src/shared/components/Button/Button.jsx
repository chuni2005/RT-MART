import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon/Icon';
import styles from './Button.module.scss';

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
  ariaLabel,
}) {
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
      aria-label={ariaLabel}
    >
      {icon && <Icon icon={icon} />}
      {!iconOnly && children}
      {badge !== null && <span className={styles.badge}>{badge}</span>}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'outline', 'login']),
  onClick: PropTypes.func,
  children: PropTypes.node,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
  ]),
  iconOnly: PropTypes.bool,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Button;
