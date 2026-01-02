import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/shared/components/Button";
import Icon from "@/shared/components/Icon";
import Alert from "@/shared/components/Alert";
import Select from "@/shared/components/Select";
import Dialog from "@/shared/components/Dialog";
import ItemListCard from "@/shared/components/ItemListCard";
import sellerService from "@/shared/services/sellerService";
import { AlertType } from "@/types";
import { Order, OrderStatus } from "@/types/order";
import { getOrderStatusText } from "@/shared/utils/orderUtils";
import { useSSE } from "@/shared/hooks/useSSE";
import styles from "./OrderDetail.module.scss";

function OrderDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const alertRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  // Custom setAlert with scroll behavior
  const showAlert = (alertData: { type: AlertType; message: string } | null) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const loadOrder = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await sellerService.getOrder(id);
      setOrder(data);
    } catch (error) {
      console.error("載入訂單失敗:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // SSE Real-time Updates
  useSSE({
    'order:updated': useCallback((data: { orderId: string; status: OrderStatus }) => {
      // Only update if this is the current order
      if (data.orderId === orderId) {
        console.log('Order updated via SSE, refreshing...');
        if (orderId) {
          loadOrder(orderId);
        }
      }
    }, [orderId, loadOrder]),
  });

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;

    // 如果選擇「已取消」，先顯示確認對話框
    if (newStatus === 'cancelled') {
      setPendingStatus(newStatus);
      setShowCancelDialog(true);
      return;
    }

    // 其他狀態直接更新
    await executeStatusUpdate(newStatus);
  };

  const executeStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;

    setUpdating(true);
    try {
      await sellerService.updateOrderStatus(order.orderId, newStatus, "");
      setOrder({ ...order, status: newStatus });
      showAlert({
        type: 'success',
        message: '訂單狀態更新成功',
      });
    } catch (error) {
      console.error("更新訂單狀態失敗:", error);
      showAlert({
        type: 'error',
        message: error instanceof Error ? error.message : '更新訂單狀態失敗，請稍後再試。',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (pendingStatus) {
      await executeStatusUpdate(pendingStatus);
      setPendingStatus(null);
    }
  };

  const handleCancelDialog = () => {
    setShowCancelDialog(false);
    setPendingStatus(null);
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  if (!order) {
    return <div className={styles.error}>訂單不存在</div>;
  }

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      credit_card: "信用卡",
      cash_on_delivery: "貨到付款",
      debit_card: "金融卡",
      bank_transfer: "銀行轉帳",
    };
    return methodMap[method] || method;
  };

  const statusOptions = [
    { value: "pending_payment", label: "待付款" },
    { value: "paid", label: "已付款" },
    { value: "processing", label: "處理中" },
    { value: "shipped", label: "已出貨" },
    { value: "delivered", label: "已送達" },
    { value: "completed", label: "已完成" },
    { value: "cancelled", label: "已取消" },
  ];

  return (
    <div className={styles.orderDetail}>
      <div className={styles.header}>
        <Button
          variant="ghost"
          onClick={() => navigate("/seller/orders")}
          className={styles.backButton}
        >
          <Icon icon="arrow-left" />
          返回列表
        </Button>
        <h1 className={styles.pageTitle}>訂單詳情</h1>
      </div>

      <div className={styles.content}>
        {/* Alert */}
        {alert && (
          <div ref={alertRef}>
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <Dialog
          isOpen={showCancelDialog}
          onClose={handleCancelDialog}
          title="確認取消訂單"
          message="您確定要將此訂單標記為「已取消」嗎？此操作將釋放庫存，且無法復原。"
          type="confirm"
          variant="warning"
          confirmText="確定取消"
          cancelText="返回"
          onConfirm={handleConfirmCancel}
          onCancel={handleCancelDialog}
        />

        {/* 訂單資訊卡片 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>訂單資訊</h2>
            <span className={`${styles.status} ${styles[order.status]}`}>
              {getOrderStatusText(order.status)}
            </span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>訂單編號</span>
              <span className={styles.value}>{order.orderNumber}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>下單時間</span>
              <span className={styles.value}>
                {new Date(order.createdAt).toLocaleString("zh-TW")}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>付款方式</span>
              <span className={styles.value}>
                {getPaymentMethodText(order.paymentMethod)}
              </span>
            </div>
            {order.paidAt && (
              <div className={styles.infoItem}>
                <span className={styles.label}>付款時間</span>
                <span className={styles.value}>
                  {new Date(order.paidAt).toLocaleString("zh-TW")}
                </span>
              </div>
            )}
          </div>

          {order.note && (
            <div className={styles.noteBox}>
              <Icon icon="message" />
              <div>
                <strong>買家備註：</strong>
                <p>{order.note}</p>
              </div>
            </div>
          )}
        </section>

        {/* 收件資訊 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>收件資訊</h2>
          <div className={styles.addressBox}>
            <div className={styles.addressItem}>
              <Icon icon="user" />
              <span>{order.shippingAddress.recipientName}</span>
            </div>
            <div className={styles.addressItem}>
              <Icon icon="phone" />
              <span>{order.shippingAddress.phone}</span>
            </div>
            <div className={styles.addressItem}>
              <Icon icon="location-dot" />
              <span>
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                {order.shippingAddress.district} {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              </span>
            </div>
          </div>
        </section>

        {/* 商品列表 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>訂單商品</h2>
          <div className={styles.productList}>
            {order.items.map((item) => (
              <ItemListCard
                key={item.id}
                variant="order-detail"
                item={{
                  id: item.id,
                  productId: item.productId,
                  productName: item.productName,
                  productImage: item.productImage,
                  price: item.price,
                  quantity: item.quantity,
                }}
                onClick={() => navigate(`/product/${item.productId}`)}
              />
            ))}
          </div>
        </section>

        {/* 金額明細 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>金額明細</h2>
          <div className={styles.priceList}>
            <div className={styles.priceItem}>
              <span>商品小計</span>
              <span>NT$ {order.subtotal.toLocaleString()}</span>
            </div>
            <div className={styles.priceItem}>
              <span>運費</span>
              <span>NT$ {order.shipping.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className={styles.priceItem}>
                <span>折扣</span>
                <span className={styles.discount}>
                  -NT$ {order.discount.toLocaleString()}
                </span>
              </div>
            )}
            <div className={styles.priceTotal}>
              <span>訂單總額</span>
              <span className={styles.totalAmount}>
                NT$ {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* 狀態管理 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>訂單狀態管理</h2>
          <div className={styles.statusManagement}>
            <Select
              value={order.status}
              onChange={(value) => handleStatusChange(value as OrderStatus)}
              options={statusOptions}
              disabled={updating}
            />
            <p className={styles.hint}>變更訂單狀態後，買家將收到通知</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OrderDetail;
