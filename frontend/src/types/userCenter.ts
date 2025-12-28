import { OrderListItem, OrderStatus } from './order'; // Assuming order.ts is in the same directory

// UserSidebar types
export interface UserSidebarProps {
  activeRoute: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

// OrderTimeline types
export interface OrderTimelineProps {
  status: OrderStatus;
  timestamps: {
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    completedAt?: string;
  };
}

export interface TimelineStep {
  label: string;
  key: keyof OrderTimelineProps['timestamps'];
  isCompleted: boolean;
  timestamp?: string;
}

// OrderCard types
export type OrderAction = 'pay' | 'cancel' | 'confirm' | 'review' | 'reorder';

export interface OrderCardProps {
  order: OrderListItem;
  onViewDetail: (orderId: string) => void;
  onAction: (orderId: string, action: OrderAction) => void;
  isProcessing?: boolean;
}
