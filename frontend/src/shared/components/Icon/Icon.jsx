import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';

/**
 * Icon Component - Wrapper for FontAwesome icons
 *
 * @param {Object} props
 * @param {Object|string|Array} props.icon - FontAwesome icon object, icon name string, or array format
 * @param {string} props.size - Icon size (xs, sm, lg, xl, 2x, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {string} props.color - Icon color (CSS color value)
 * @param {boolean} props.spin - Whether to spin the icon
 * @param {boolean} props.pulse - Whether to pulse the icon
 */
function Icon({
  icon,
  size,
  className = '',
  onClick,
  color,
  spin = false,
  pulse = false,
  ...rest
}) {
  return (
    <FontAwesomeIcon
      icon={icon}
      size={size}
      className={className}
      onClick={onClick}
      color={color}
      spin={spin}
      pulse={pulse}
      {...rest}
    />
  );
}

Icon.propTypes = {
  icon: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
  ]).isRequired,
  size: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  color: PropTypes.string,
  spin: PropTypes.bool,
  pulse: PropTypes.bool,
};

export default Icon;
