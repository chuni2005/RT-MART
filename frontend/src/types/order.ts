// Order related types

export type PaymentMethod = 'credit_card' | 'cash_on_delivery';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  addressId: string;
  paymentMethod: PaymentMethod;
  note?: string;
  subtotal: number;
  shipping: number;
  discount: number;
  totalAmount: number;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  totalAmount: number;
}
