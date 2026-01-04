export class SalesReportItemDto {
  // 訂單資訊
  orderDate: string; // 訂單日期 (YYYY-MM-DD HH:mm)
  orderNumber: string; // 訂單編號
  orderStatus: string; // 訂單狀態

  // 商品資訊
  productName: string; // 商品名稱 (from productSnapshot)
  quantity: number; // 銷售數量

  // 價格明細
  originalPrice: number; // 商品原價（單價）
  itemDiscount: number; // 商品折扣金額（單項）
  unitPrice: number; // 實際單價（原價 - 折扣）
  itemSubtotal: number; // 原始小計（原價 × 數量）
  subtotal: number; // 折後小計（單價 × 數量）

  // 財務計算
  paymentFee: number; // 金流手續費（1% of subtotal）
  netAmount: number; // 淨額（subtotal - paymentFee）

  // 訂單層級資訊
  shippingFee: number; // 運費
  totalDiscount: number; // 訂單總折扣
  discountCode: string | null; // 使用折扣代碼
  paymentMethod: string; // 付款方式
}
