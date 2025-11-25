import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core';

/**
 * Icon Component - Wrapper for FontAwesome icons
 */
interface IconProps {
  icon: IconProp;
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

export default Icon;
