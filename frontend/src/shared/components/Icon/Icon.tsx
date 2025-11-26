import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core';
import { iconMap } from '@/shared/lib/iconMap';

/**
 * Icon Component - Wrapper for FontAwesome icons
 * Supports both IconProp objects and string icon names
 */
interface IconProps {
  icon: IconProp | string;
  size?: SizeProp;
  className?: string;
  onClick?: () => void;
  color?: string;
  spin?: boolean;
  pulse?: boolean;
  [key: string]: any;
}

function Icon({
  icon,
  size,
  className = '',
  onClick,
  color,
  spin = false,
  pulse = false,
  ...rest
}: IconProps) {
  // Convert string icon name to IconProp
  const resolvedIcon: IconProp = typeof icon === 'string'
    ? (iconMap[icon] || icon as IconProp)
    : icon;

  return (
    <FontAwesomeIcon
      icon={resolvedIcon}
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

export default Icon;
