import { OrderStatus } from '@/types/order';

/**
 * 獲取訂單狀態的中文文字
 */
export function getOrderStatusText(status: OrderStatus): string {
  const statusTextMap: Record<OrderStatus, string> = {
    pending_payment: '待付款',
    payment_failed: '付款失敗',
    paid: '已付款',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    completed: '已完成',
    cancelled: '已取消',
  };

  return statusTextMap[status] || status;
}

/**
 * 獲取訂單狀態的顏色
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const statusColorMap: Record<OrderStatus, string> = {
    pending_payment: '#ffc107', // 黃色
    payment_failed: '#dc3545',  // 紅色
    paid: '#17a2b8',            // 藍色
    processing: '#007bff',      // 深藍色
    shipped: '#6f42c1',         // 紫色
    delivered: '#28a745',       // 綠色
    completed: '#28a745',       // 綠色
    cancelled: '#6c757d',       // 灰色
  };

  return statusColorMap[status] || '#6c757d';
}

/**
 * 獲取付款方式的中文文字
 */
export function getPaymentMethodText(method: string): string {
  const methodTextMap: Record<string, string> = {
    credit_card: '信用卡',
    cash_on_delivery: '貨到付款',
    debit_card: '金融卡',
    bank_transfer: '銀行轉帳',
  };

  return methodTextMap[method] || method;
}
