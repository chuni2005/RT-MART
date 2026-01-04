import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Alert from '@/shared/components/Alert';
import Select from '@/shared/components/Select';
import EmptyState from '@/shared/components/EmptyState';
import sellerService from '@/shared/services/sellerService';
import { AlertType } from '@/types';
import { Order, OrderStatus } from '@/types';
import { getOrderStatusText } from '@/shared/utils/orderUtils';
import styles from './OrderList.module.scss';

function OrderList() {
  const navigate = useNavigate();
  const alertRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

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
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await sellerService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('載入訂單失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // 狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // 搜尋篩選 (只搜尋訂單編號)
    if (searchQuery) {
      filtered = filtered.filter((o) =>
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      setOrders(
        orders.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
      showAlert({
        type: 'success',
        message: '訂單狀態更新成功',
      });
    } catch (error) {
      showAlert({
        type: 'error',
        message: error instanceof Error ? error.message : '更新訂單狀態失敗，請稍後再試。',
      });
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending_payment', label: '待付款' },
    { value: 'paid', label: '已付款' },
    { value: 'processing', label: '處理中' },
    { value: 'shipped', label: '已出貨' },
    { value: 'delivered', label: '已送達' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  return (
    <div className={styles.orderList}>
      <h1 className={styles.pageTitle}>訂單管理</h1>

      {/* 篩選區域 */}
      <div className={styles.filters}>
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
        <div className={styles.searchBox}>
          <Icon icon="search" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="搜尋訂單編號..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as OrderStatus | "all")}
          options={statusOptions}
        />
      </div>

      {/* 訂單列表 */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="尚無訂單"
          message={
            statusFilter !== "all" || searchQuery
              ? "沒有符合條件的訂單"
              : "目前還沒有任何訂單"
          }
        />
      ) : (
        <div className={styles.ordersContainer}>
          {filteredOrders.map((order) => (
            <div key={order.orderId} className={styles.orderCard}>
              {/* 訂單標題 */}
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderNumber}>
                    {order.orderNumber}
                  </span>
                  <span className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                  </span>
                </div>
                <span className={`${styles.status} ${styles[order.status]}`}>
                  {getOrderStatusText(order.status)}
                </span>
              </div>

              {/* 訂單總額 */}
              <div className={styles.orderFooter}>
                <div className={styles.totalAmount}>
                  訂單總額：
                  <span className={styles.amount}>
                    NT$ {order.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className={styles.orderActions}>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/seller/order/${order.orderId}`)}
                  >
                    查看詳情
                  </Button>

                  {/* 根據狀態顯示不同的操作按鈕 */}
                  {order.status === "paid" && (
                    <Button
                      onClick={() =>
                        handleStatusChange(order.orderId, "processing")
                      }
                    >
                      開始處理
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button
                      onClick={() =>
                        handleStatusChange(order.orderId, "shipped")
                      }
                    >
                      標記已出貨
                    </Button>
                  )}
                  {order.status === "shipped" && (
                    <Button
                      onClick={() =>
                        handleStatusChange(order.orderId, "delivered")
                      }
                    >
                      標記已送達
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderList;
