import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.scss';

function Button({
  variant = 'primary',
  onClick,
  children,
  type = 'button',
  disabled = false,
  fullWidth = false,
}) {
  const buttonClasses = [
    styles.btn,
    variant === 'primary' ? styles.btnPrimary : styles.btnOutline,
    fullWidth && styles.fullWidth,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'outline']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
};

export default Button;
