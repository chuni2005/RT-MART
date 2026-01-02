import { ReactNode, CSSProperties, MouseEvent } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { StoreOrderGroup } from './order';

// Common component prop types

// DateRangeFilter types
export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  showQuickSelectors?: boolean;
  onQuickSelect?: (period: 'day' | 'week' | 'month' | 'year') => void;
  activeQuickSelector?: 'day' | 'week' | 'month' | 'year' | null;
  className?: string;
}

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
  size?: 'sm' | 'md' | 'lg';
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
  // Store information
  storeId: string;
  storeName: string;
}

// StoreGroupHeader types (Shared component)
export interface StoreGroupHeaderProps {
  storeId: string;
  storeName: string;
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
  onStoreClick?: () => void;
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
  className?: string;
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

// Address types
export interface Address {
  id: string;
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  isDefault: boolean;
}

// CheckoutSummary types
/**
 * @deprecated 使用 CheckoutSummaryCartModeProps 或 CheckoutSummaryCheckoutModeProps
 */
export interface CheckoutSummaryProps {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
  selectedCount: number;
  freeShippingThreshold?: number;
  onCheckout: () => void;
  disabled: boolean;
  buttonText?: string;
}

/**
 * CheckoutSummary 統一 Props
 * 用於購物車和結帳頁面的結帳摘要
 */
export interface CheckoutSummaryCheckoutModeProps {
  storeGroups: StoreOrderGroup[];
  selectedCount?: number; // 購物車模式使用：已選取數量
  appliedDiscounts?: import('./order').ManualDiscountSelection | null;
  onCheckout: () => void;
  onDiscountChange?: () => void;
  disabled?: boolean;
  buttonText?: string;
}

// QuantitySelector types
export interface QuantitySelectorProps {
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  readOnly?: boolean;
  onValidationError?: (message: string) => void;
  onBlur?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

// Dialog types
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | ReactNode;
  type?: 'confirm' | 'alert' | 'custom';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  icon?: string;
  mediaUrl?: string; // 圖片或影片的路徑（優先於 icon）
  mediaType?: 'image' | 'video'; // 媒體類型（預設自動偵測）
  children?: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// Logo types
export interface LogoProps {
  variant?: 'default' | 'with-text';
  to?: string;
  className?: string;
}

// LanguageMenu types
export interface LanguageMenuProps {
  variant?: 'default' | 'topbar';
  className?: string;
  classNames?: {
    icon?: string;
    trigger?: string;
    chevron?: string;
    dropdown?: string;
    option?: string;
    optionActive?: string;
  };
}

// ProtectedRoute types
export interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: 'buyer' | 'seller' | 'admin';
  excludeRoles?: Array<'buyer' | 'seller' | 'admin'>;
}