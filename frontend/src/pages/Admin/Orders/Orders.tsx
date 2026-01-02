import { useState, useEffect, useRef } from "react";
import Icon from "@/shared/components/Icon";
import Button from "@/shared/components/Button";
import Select from "@/shared/components/Select";
import SearchBar from "@/shared/components/Header/SearchBar";
import EmptyState from "@/shared/components/EmptyState";
import Alert from "@/shared/components/Alert";
import Dialog from "@/shared/components/Dialog";
import FormInput from "@/shared/components/FormInput";
import adminService from "@/shared/services/adminService.index";
import { AdminOrder, AdminOrderFilters } from "@/types/admin";
import { AlertType, SelectOption } from "@/types";
import { OrderStatus } from "@/types/order";
import styles from "./Orders.module.scss";

// 訂單狀態選項（用於篩選）
const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "全部狀態" },
  { value: "pending_payment", label: "待付款" },
  { value: "paid", label: "已付款" },
  { value: "processing", label: "處理中" },
  { value: "shipped", label: "已出貨" },
  { value: "delivered", label: "已送達" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

// 可修改的訂單狀態選項（不包含 "all"）
const EDITABLE_STATUS_OPTIONS: SelectOption[] = [
  { value: "pending_payment", label: "待付款" },
  { value: "payment_failed", label: "付款失敗" },
  { value: "paid", label: "已付款" },
  { value: "processing", label: "處理中" },
  { value: "shipped", label: "已出貨" },
  { value: "delivered", label: "已送達" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

// 常見取消原因
const COMMON_CANCEL_REASONS = [
  "買家要求取消",
  "商品缺貨",
  "付款問題",
  "地址無法配送",
];

// 訂單狀態標籤
const getStatusLabel = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending_payment: "待付款",
    payment_failed: "付款失敗",
    paid: "已付款",
    processing: "處理中",
    shipped: "已出貨",
    delivered: "已送達",
    completed: "已完成",
    cancelled: "已取消",
  };
  return statusMap[status] || status;
};

// 訂單狀態樣式類別
const getStatusClass = (status: OrderStatus): string => {
  const statusClassMap: Record<OrderStatus, string> = {
    pending_payment: "pending",
    payment_failed: "failed",
    paid: "paid",
    processing: "processing",
    shipped: "shipped",
    delivered: "delivered",
    completed: "completed",
    cancelled: "cancelled",
  };
  return statusClassMap[status] || "pending";
};

// 付款方式標籤
const getPaymentMethodLabel = (method: string): string => {
  const paymentMap: Record<string, string> = {
    credit_card: "信用卡",
    cash_on_delivery: "貨到付款",
    debit_card: "金融卡",
    bank_transfer: "銀行轉帳",
  };
  return paymentMap[method] || method;
};

function Orders() {
  const alertRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [alert, setAlert] = useState<{
    type: AlertType;
    message: string;
  } | null>(null);

  // Custom setAlert with scroll behavior
  const showAlert = (alertData: { type: AlertType; message: string } | null) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  // 篩選狀態
  const [filters, setFilters] = useState<AdminOrderFilters>({
    search: "",
    status: "all",
    startDate: "",
    endDate: "",
  });

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending_payment");
  const [cancelReason, setCancelReason] = useState("");

  // 初始載入最新訂單
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (customFilters?: AdminOrderFilters) => {
    setLoading(true);
    setAlert(null);
    try {
      const filterParams = customFilters || filters;
      const { orders: fetchedOrders } = await adminService.getAdminOrders({
        ...filterParams,
        limit: 20, // 預設顯示最新20筆
      });
      setOrders(fetchedOrders);
      setSearched(true);
    } catch (error) {
      console.error("載入訂單失敗:", error);
      showAlert({ type: "error", message: "載入訂單失敗" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    const newFilters = { ...filters, search: keyword };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters, status: value as OrderStatus | "all" };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  const handleViewDetail = async (order: AdminOrder) => {
    try {
      const fullOrder = await adminService.getAdminOrderById(order.order_id);
      setSelectedOrder(fullOrder);
      setShowDetailDialog(true);
    } catch (error) {
      console.error("載入訂單詳情失敗:", error);
      showAlert({ type: "error", message: "載入訂單詳情失敗" });
    }
  };

  const handleUpdateStatus = async (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCancelReason("");
    setShowStatusDialog(true);
  };

  const handleConfirmUpdateStatus = async () => {
    if (!selectedOrder) return;

    // 如果選擇取消狀態，需要檢查取消原因
    if (newStatus === "cancelled" && !cancelReason.trim()) {
      showAlert({ type: "warning", message: "請輸入取消原因" });
      return;
    }

    try {
      if (newStatus === "cancelled") {
        // 使用取消訂單 API（會發送取消原因給買家和賣家）
        await adminService.cancelAdminOrder(selectedOrder.order_id, cancelReason);
        showAlert({ type: "success", message: "訂單已取消" });
      } else {
        // 使用更新狀態 API
        await adminService.updateAdminOrderStatus(selectedOrder.order_id, newStatus);
        showAlert({ type: "success", message: "訂單狀態已更新" });
      }

      setShowStatusDialog(false);
      setSelectedOrder(null);
      setCancelReason("");
      loadOrders();
    } catch (error) {
      showAlert({ type: "error", message: "更新訂單狀態失敗" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  return (
    <div className={styles.ordersPage}>
      <h1 className={styles.pageTitle}>訂單管理</h1>

      {alert && (
        <div ref={alertRef}>
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* 篩選工具列 */}
      <div className={styles.toolbar}>
        <div className={styles.searchSection}>
          <SearchBar
            placeholder="搜尋訂單編號、買家、賣家"
            onSearch={handleSearch}
            formClassName={styles.searchBar}
          />
          <Select
            options={STATUS_OPTIONS}
            value={filters.status || "all"}
            onChange={handleStatusChange}
            icon="filter"
            ariaLabel="篩選訂單狀態"
            className={styles.statusFilter}
          />
        </div>

        <div className={styles.dateFilters}>
          <div className={styles.dateField}>
            <label htmlFor="startDate">開始日期</label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.dateField}>
            <label htmlFor="endDate">結束日期</label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      </div>

      {/* 訂單列表 */}
      {loading ? (
        <div className={styles.loading}>
          <Icon icon="spinner" className={styles.spinner} />
          <p>載入中...</p>
        </div>
      ) : !searched || orders.length === 0 ? (
        <EmptyState
          type="admin-order"
          title={searched ? "未找到訂單" : "請使用上方篩選條件查詢訂單"}
          message={
            searched
              ? "請嘗試調整搜尋條件或篩選器"
              : "系統預設顯示最新訂單，您可以使用搜尋或篩選功能查詢特定訂單"
          }
        />
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>買家</th>
                <th>賣家/商店</th>
                <th>訂單金額</th>
                <th>付款方式</th>
                <th>訂單狀態</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    <div className={styles.orderNumber}>
                      {order.order_number}
                    </div>
                  </td>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{order.buyer_name}</div>
                      <div className={styles.userEmail}>
                        {order.buyer_email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.storeInfo}>
                      <div className={styles.sellerName}>
                        {order.seller_name}
                      </div>
                      <div className={styles.storeName}>{order.store_name}</div>
                    </div>
                  </td>
                  <td className={styles.amount}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td>{getPaymentMethodLabel(order.payment_method)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[getStatusClass(order.status)]
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className={styles.date}>
                    {formatDate(order.created_at)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="eye"
                        onClick={() => handleViewDetail(order)}
                        ariaLabel="檢視詳情"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="pen-to-square"
                        onClick={() => handleUpdateStatus(order)}
                        ariaLabel="修改狀態"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 訂單詳情 Dialog */}
      <Dialog
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedOrder(null);
        }}
        title="訂單詳情"
        type="custom"
        className={styles.detailDialog}
      >
        {selectedOrder && (
          <div className={styles.orderDetail}>
            {/* 訂單資訊 */}
            <div className={styles.section}>
              <h3>訂單資訊</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>訂單編號</label>
                  <span>{selectedOrder.order_number}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>訂單狀態</label>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[getStatusClass(selectedOrder.status)]
                    }`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>付款方式</label>
                  <span>
                    {getPaymentMethodLabel(selectedOrder.payment_method)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>建立時間</label>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
                {selectedOrder.paid_at && (
                  <div className={styles.infoItem}>
                    <label>付款時間</label>
                    <span>{formatDate(selectedOrder.paid_at)}</span>
                  </div>
                )}
                {selectedOrder.shipped_at && (
                  <div className={styles.infoItem}>
                    <label>出貨時間</label>
                    <span>{formatDate(selectedOrder.shipped_at)}</span>
                  </div>
                )}
                {selectedOrder.delivered_at && (
                  <div className={styles.infoItem}>
                    <label>送達時間</label>
                    <span>{formatDate(selectedOrder.delivered_at)}</span>
                  </div>
                )}
                {selectedOrder.completed_at && (
                  <div className={styles.infoItem}>
                    <label>完成時間</label>
                    <span>{formatDate(selectedOrder.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 買家資訊 */}
            <div className={styles.section}>
              <h3>買家資訊</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>姓名</label>
                  <span>{selectedOrder.buyer_name}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Email</label>
                  <span>{selectedOrder.buyer_email}</span>
                </div>
              </div>
            </div>

            {/* 賣家資訊 */}
            <div className={styles.section}>
              <h3>賣家資訊</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>賣家名稱</label>
                  <span>{selectedOrder.seller_name}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>商店名稱</label>
                  <span>{selectedOrder.store_name}</span>
                </div>
              </div>
            </div>

            {/* 收貨地址 */}
            <div className={styles.section}>
              <h3>收貨地址</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>收件人</label>
                  <span>{selectedOrder.shipping_address.recipientName}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>聯絡電話</label>
                  <span>{selectedOrder.shipping_address.phone}</span>
                </div>
                <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                  <label>配送地址</label>
                  <span>
                    {selectedOrder.shipping_address.postalCode}{" "}
                    {selectedOrder.shipping_address.city}
                    {selectedOrder.shipping_address.district}
                    {selectedOrder.shipping_address.addressLine1}
                    {selectedOrder.shipping_address.addressLine2 && ` ${selectedOrder.shipping_address.addressLine2}`}
                  </span>
                </div>
              </div>
            </div>

            {/* 訂單商品 */}
            <div className={styles.section}>
              <h3>訂單商品</h3>
              <div className={styles.itemsList}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className={styles.itemImage}
                      />
                    )}
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item.productName}</div>
                      <div className={styles.itemPrice}>
                        {formatCurrency(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className={styles.itemTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 金額明細 */}
            <div className={styles.section}>
              <h3>金額明細</h3>
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>商品小計</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>運費</span>
                  <span>{formatCurrency(selectedOrder.shipping)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className={styles.priceRow}>
                    <span>折扣</span>
                    <span className={styles.discount}>
                      -{formatCurrency(selectedOrder.discount)}
                    </span>
                  </div>
                )}
                <div className={`${styles.priceRow} ${styles.total}`}>
                  <span>訂單總額</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* 備註 */}
            {selectedOrder.note && (
              <div className={styles.section}>
                <h3>訂單備註</h3>
                <p className={styles.note}>{selectedOrder.note}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* 修改訂單狀態 Dialog */}
      <Dialog
        isOpen={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false);
          setSelectedOrder(null);
          setCancelReason("");
        }}
        title="修改訂單狀態"
        type="custom"
        textAlign="left"
      >
        {selectedOrder && (
          <div className={styles.statusDialogContent}>
            <p>
              訂單編號：<strong>{selectedOrder.order_number}</strong>
            </p>
            <p>
              目前狀態：
              <span
                className={`${styles.statusBadge} ${
                  styles[getStatusClass(selectedOrder.status)]
                }`}
              >
                {getStatusLabel(selectedOrder.status)}
              </span>
            </p>
            <div className={styles.statusSelectWrapper}>
              <label htmlFor="newStatus">新狀態：</label>
              <div className={styles.selectWrapper}>
                <Select
                  options={EDITABLE_STATUS_OPTIONS}
                  value={newStatus}
                  onChange={(value) => setNewStatus(value as OrderStatus)}
                  ariaLabel="選擇新狀態"
                />
              </div>
            </div>

            {/* 如果選擇取消狀態，顯示取消原因輸入 */}
            {newStatus === "cancelled" && (
              <div className={styles.cancelReasonSection}>
                <div className={styles.quickReasons}>
                  <label className={styles.quickReasonsLabel}>
                    常見取消原因：
                  </label>
                  <div className={styles.quickReasonButtons}>
                    {COMMON_CANCEL_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        className={styles.quickReasonBtn}
                        onClick={() => setCancelReason(reason)}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <FormInput
                  name="cancelReason"
                  label="取消原因"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="請輸入取消原因"
                  required
                />

                <div className={styles.warning}>
                  <strong>注意：</strong>
                  取消原因將發送給買家和賣家，請謹慎填寫。
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className={styles.actions}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setSelectedOrder(null);
                  setCancelReason("");
                }}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmUpdateStatus}
                disabled={newStatus === "cancelled" && !cancelReason.trim()}
              >
                確認修改
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default Orders;
