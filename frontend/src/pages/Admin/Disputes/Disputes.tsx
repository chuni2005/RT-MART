import { useState, useEffect } from 'react';
import Icon from '@/shared/components/Icon';
import Button from '@/shared/components/Button';
import Select from '@/shared/components/Select';
import SearchBar from '@/shared/components/Header/SearchBar';
import EmptyState from '@/shared/components/EmptyState';
import Alert from '@/shared/components/Alert';
import Dialog from '@/shared/components/Dialog';
import FormInput from '@/shared/components/FormInput';
import adminService from '@/shared/services/adminService';
import { AdminOrder, AdminOrderFilters } from '@/types/admin';
import { AlertType, SelectOption } from '@/types';
import { OrderStatus } from '@/types/order';
import styles from './Disputes.module.scss';

// 訂單狀態選項
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: '全部狀態' },
  { value: 'pending_payment', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'processing', label: '處理中' },
  { value: 'shipped', label: '已出貨' },
  { value: 'delivered', label: '已送達' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

// 訂單狀態標籤
const getStatusLabel = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending_payment: '待付款',
    payment_failed: '付款失敗',
    paid: '已付款',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
};

// 訂單狀態樣式類別
const getStatusClass = (status: OrderStatus): string => {
  const statusClassMap: Record<OrderStatus, string> = {
    pending_payment: 'pending',
    payment_failed: 'failed',
    paid: 'paid',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return statusClassMap[status] || 'pending';
};

// 付款方式標籤
const getPaymentMethodLabel = (method: string): string => {
  const paymentMap: Record<string, string> = {
    credit_card: '信用卡',
    cash_on_delivery: '貨到付款',
    debit_card: '金融卡',
    bank_transfer: '銀行轉帳',
  };
  return paymentMap[method] || method;
};

function Disputes() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  // 篩選狀態
  const [filters, setFilters] = useState<AdminOrderFilters>({
    search: '',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagNotes, setFlagNotes] = useState('');

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
      console.error('載入訂單失敗:', error);
      setAlert({ type: 'error', message: '載入訂單失敗' });
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
    const newFilters = { ...filters, status: value as OrderStatus | 'all' };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
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
      console.error('載入訂單詳情失敗:', error);
      setAlert({ type: 'error', message: '載入訂單詳情失敗' });
    }
  };

  const handleFlagOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setFlagNotes('');
    setShowFlagDialog(true);
  };

  const handleConfirmFlag = async () => {
    if (!selectedOrder) return;
    if (!flagNotes.trim()) {
      setAlert({ type: 'warning', message: '請輸入備註說明' });
      return;
    }

    try {
      await adminService.flagOrder(selectedOrder.order_id, flagNotes);
      setAlert({ type: 'success', message: '訂單已標記為異常' });
      setShowFlagDialog(false);
      setFlagNotes('');
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      console.error('標記失敗:', error);
      setAlert({ type: 'error', message: '標記失敗' });
    }
  };

  const handleUnflagOrder = async (order: AdminOrder) => {
    try {
      await adminService.unflagOrder(order.order_id);
      setAlert({ type: 'success', message: '已取消標記異常' });
      loadOrders();
    } catch (error) {
      console.error('取消標記失敗:', error);
      setAlert({ type: 'error', message: '取消標記失敗' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  return (
    <div className={styles.disputes}>
      <h1 className={styles.pageTitle}>訂單管理</h1>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
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
          icon="magnifying-glass"
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
                <tr
                  key={order.order_id}
                  className={order.is_flagged ? styles.flagged : ""}
                >
                  <td>
                    <div className={styles.orderNumber}>
                      {order.is_flagged && (
                        <Icon
                          icon="triangle-exclamation"
                          className={styles.flagIcon}
                        />
                      )}
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
                      {order.is_flagged ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="circle-check"
                          onClick={() => handleUnflagOrder(order)}
                          ariaLabel="取消標記"
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="flag"
                          onClick={() => handleFlagOrder(order)}
                          ariaLabel="標記異常"
                        />
                      )}
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
                    {selectedOrder.shipping_address.detail}
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

            {/* 管理員備註 */}
            {selectedOrder.admin_notes && (
              <div className={styles.section}>
                <h3>管理員備註</h3>
                <p className={styles.adminNote}>{selectedOrder.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* 標記異常 Dialog */}
      <Dialog
        isOpen={showFlagDialog}
        onClose={() => {
          setShowFlagDialog(false);
          setFlagNotes("");
          setSelectedOrder(null);
        }}
        title="標記訂單異常"
        type="confirm"
        variant="warning"
        confirmText="確認標記"
        cancelText="取消"
        onConfirm={handleConfirmFlag}
        onCancel={() => {
          setShowFlagDialog(false);
          setFlagNotes("");
          setSelectedOrder(null);
        }}
      >
        {selectedOrder && (
          <div className={styles.flagDialogContent}>
            <p className={styles.warningText}>
              您正在標記訂單 <strong>{selectedOrder.order_number}</strong>{" "}
              為異常狀態
            </p>
            <FormInput
              name="flagNotes"
              label="備註說明"
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value)}
              placeholder="請輸入異常原因或備註說明"
              required
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default Disputes;
