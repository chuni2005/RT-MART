import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getOrderDetail } from '@/shared/services/orderService';
import type { Order, OrderStatus, PaymentMethod } from '@/types/order';
import Button from '@/shared/components/Button';
import OrderTimeline from '@/pages/UserCenter/components/OrderTimeline';
import ItemListCard from '@/shared/components/ItemListCard';
import AddressCard from '@/pages/Checkout/components/AddressCard';
import { useSSE } from '@/shared/hooks/useSSE';
import { useAuth } from '@/shared/contexts/AuthContext';
import styles from './OrderDetailPage.module.scss';

/**
 * 訂單詳情頁面
 */
function OrderDetailPage() {
  // ========== 1. Hooks 與 State ==========
  const { user } = useAuth();
  const { order_id } = useParams<{ order_id: string }>();
  const navigate = useNavigate();

  // SECURITY: Defense in depth - block admin access even if routing fails
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== 2. 副作用 ==========
  useEffect(() => {
    if (!order_id) {
      navigate('/user/orders');
      return;
    }
    fetchOrderDetail();
  }, [order_id]);

  // ========== 3. 數據獲取 ==========
  const fetchOrderDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrderDetail(order_id!);
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order detail:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setIsLoading(false);
    }
  }, [order_id]);

  // ========== SSE Real-time Updates ==========
  useSSE({
    'order:updated': useCallback((data: { orderId: string; status: OrderStatus }) => {
      // Only update if this is the current order
      if (data.orderId === order_id) {
        console.log('Order updated via SSE, refreshing...');
        fetchOrderDetail();
      }
    }, [order_id, fetchOrderDetail]),
  });

  // ========== 4. 輔助函數 ==========
  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending_payment: '待付款',
      payment_failed: '付款失敗',
      paid: '已付款',
      processing: '處理中',
      shipped: '已出貨',
      delivered: '已送達',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || '未知狀態';
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      credit_card: '信用卡',
      cash_on_delivery: '貨到付款',
      debit_card: '金融卡',
      bank_transfer: '銀行轉帳',
    };
    return labels[method] || '未知付款方式';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('zh-TW');
  };

  // ========== 5. 渲染邏輯 ==========

  // Loading 狀態
  if (isLoading) {
    return (
      <div className={styles.orderDetailPage}>
        <div className={styles.loading}>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  // Error 狀態
  if (error || !order) {
    return (
      <div className={styles.orderDetailPage}>
        <div className={styles.error}>
          <p>{error || '訂單不存在'}</p>
          <Button variant="primary" onClick={() => navigate('/user/orders')}>
            返回訂單列表
          </Button>
        </div>
      </div>
    );
  }

  // 主要內容
  return (
    <div className={styles.orderDetailPage}>
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        icon="arrow-left"
        onClick={() => navigate('/user/orders')}
        className={styles.backButton}
      >
        返回訂單列表
      </Button>

      {/* 1. 訂單頭部 */}
      <section className={styles.section}>
        <div className={styles.orderHeader}>
          <div>
            <h2 className={styles.orderNumber}>訂單編號: {order.orderNumber}</h2>
            <p className={styles.orderDate}>下單時間: {formatDate(order.createdAt)}</p>
          </div>
          <span className={`${styles.statusBadge} ${styles[order.status]}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </section>

      {/* 2. 訂單狀態時間軸 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>訂單狀態</h3>
        <OrderTimeline
          status={order.status}
          timestamps={{
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            completedAt: order.completedAt,
          }}
        />
      </section>

      {/* 3. 商品資訊 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>商品資訊</h3>
        <div className={styles.itemList}>
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

      {/* 4. 收件資訊 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>收件資訊</h3>
        <AddressCard address={order.shippingAddress} isDefault={false} />
      </section>

      {/* 5. 金額明細 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>金額明細</h3>
        <div className={styles.amountDetails}>
          <div className={styles.amountRow}>
            <span>商品總額</span>
            <span>$ {formatCurrency(order.subtotal)}</span>
          </div>
          <div className={styles.amountRow}>
            <span>運費</span>
            <span>$ {formatCurrency(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className={styles.amountRow}>
              <span>折扣</span>
              <span className={styles.discount}>- $ {formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className={`${styles.amountRow} ${styles.total}`}>
            <span>應付金額</span>
            <span className={styles.totalAmount}>$ {formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </section>

      {/* 6. 付款資訊 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>付款資訊</h3>
        <div className={styles.paymentInfo}>
          <div className={styles.infoRow}>
            <span>付款方式</span>
            <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
          </div>
          {order.paidAt && (
            <div className={styles.infoRow}>
              <span>付款時間</span>
              <span>{formatDate(order.paidAt)}</span>
            </div>
          )}
        </div>
      </section>

      {/* 7. 訂單備註 */}
      {order.note && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>訂單備註</h3>
          <p className={styles.note}>{order.note}</p>
        </section>
      )}
    </div>
  );
}

export default OrderDetailPage;
