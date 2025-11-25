import { ReactNode, CSSProperties, MouseEvent } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

// Common component prop types

// Button types
export interface ButtonProps {
  variant?: 'primary' | 'outline' | 'login';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: IconProp | string | null;
  iconOnly?: boolean;
  badge?: string | number | null;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

// Alert types
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  type?: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

// Select types
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectClassNames {
  container?: string;
  prefixIcon?: string;
  trigger?: string;
  value?: string;
  chevron?: string;
  dropdown?: string;
  option?: string;
  optionActive?: string;
  optionFocused?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'compact' | 'topbar';
  placeholder?: string;
  icon?: IconProp | string | null;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  classNames?: SelectClassNames;
}
