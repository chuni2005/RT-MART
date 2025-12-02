import { ReactNode, CSSProperties, MouseEvent } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

// Common component prop types

// Alert types
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  type?: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

// Button types
export interface ButtonProps {
  variant?: 'primary' | 'outline' | 'login' | 'ghost';
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

export interface ProductCardProps {
  id: string | number;
  name: string;
  currentPrice: number;
  originalPrice?: number | null;
  image?: string;
  rating?: number;
  soldCount?: number | string;
  onClick?: (id: string | number) => void;
}

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TabProps {
  items: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: "default" | "underline" | "pills";
  className?: string;
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  stock: number;
  selected: boolean;
}

export interface GetCartResponse {
  success: boolean;
  message?: string;
  items: CartItem[];
  total: number;
}

// ItemListCard types
export interface ItemListCardBaseProps {
  variant: 'cart' | 'order-list' | 'order-detail';
  item: CartItem | any; // TODO: Add OrderItem type when implementing orders
  onClick?: () => void;
}

export interface CartVariantProps {
  selectable?: boolean;
  onSelect?: (selected: boolean) => void;
  editable?: boolean;
  onQuantityChange?: (quantity: number) => void;
  deletable?: boolean;
  onDelete?: () => void;
}

export interface OrderListVariantProps {
  orderHeader?: {
    orderId: string;
    orderDate: string;
    status: string;
  };
  actions?: Array<'pay' | 'cancel' | 'confirm' | 'detail'>;
  onAction?: (action: string) => void;
}

export interface OrderDetailVariantProps {
  readonly?: boolean;
}

export type ItemListCardProps = ItemListCardBaseProps &
  (CartVariantProps | OrderListVariantProps | OrderDetailVariantProps);

// EmptyState types
export interface EmptyStateProps {
  type?: 'search' | 'cart' | 'order';
  icon?: string;
  title?: string;
  message?: string | ReactNode;
  suggestions?: string[];
  buttonText?: string;
  buttonAction?: () => void;

  // Deprecated (for backward compatibility with Search page)
  keyword?: string;
  categoryName?: string;
}

