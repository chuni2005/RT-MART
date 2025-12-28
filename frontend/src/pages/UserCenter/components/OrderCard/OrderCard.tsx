import { useNavigate } from 'react-router-dom';
import { OrderListItem, OrderStatus } from '@/types/order';
import Button from '@/shared/components/Button';
import ItemListCard from '@/shared/components/ItemListCard';
import styles from './OrderCard.module.scss';

import { OrderCardProps, OrderAction } from '@/types/userCenter';

function OrderCard({ order, onViewDetail, onAction }: OrderCardProps) {
  const navigate = useNavigate();
  
  // 根據訂單狀態顯示操作按鈕
  const getActionButtons = (status: OrderStatus): OrderAction[] => {
    switch (status) {
      case 'pending_payment':
        return ['pay', 'cancel'];
      case 'processing':
        return ['cancel'];
      case 'shipped':
      case 'delivered':
        return ['confirm'];
      case 'completed':
        return ['reorder', 'review'];
      default:
        return [];
    }
  };

  const actionButtons = getActionButtons(order.status);

  // 操作按鈕標籤映射
  const actionLabels: Record<OrderAction, string> = {
    pay: '付款',
    cancel: '取消訂單',
    confirm: '確認收貨',
    review: '評價',
    reorder: '再買一次',
  };

  // 狀態標籤映射
  const statusLabels: Record<OrderStatus, string> = {
    pending_payment: '待付款',
    payment_failed: '付款失敗',
    paid: '已付款',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    completed: '已完成',
    cancelled: '已取消',
  };

  return (
    <div className={styles.orderCard}>
      {/* 訂單頭部 */}
      <div className={styles.orderHeader}>
        <div className={styles.orderInfo}>
          <span className={styles.orderNumber}>
            訂單編號: {order.orderNumber}
          </span>
          <span className={styles.orderDate}>
            {new Date(order.createdAt).toLocaleString("zh-TW")}
          </span>
        </div>
        <span className={`${styles.statusBadge} ${styles[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>

      {/* 商品列表（使用 ItemListCard）*/}
      <div className={styles.itemList}>
        {order.items.slice(0, 3).map((item) => (
          <ItemListCard
            key={item.id}
            variant="order-list"
            item={item}
            onClick={() => {
              navigate(`/product/${item.productId}`);
            }}
          />
        ))}
        {order.items.length > 3 && (
          <p className={styles.moreItems}>
            還有 {order.items.length - 3} 件商品...
          </p>
        )}
      </div>

      {/* 訂單底部 */}
      <div className={styles.orderFooter}>
        <div className={styles.totalAmount}>
          <span>訂單總額:</span>
          <span className={styles.amount}>$ {order.totalAmount}</span>
        </div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={() => onViewDetail(order.orderId)}
            className={styles.actionsBtn}
          >
            查看詳情
          </Button>
          {actionButtons.map((action) => (
            <Button
              key={action}
              variant={action === "pay" ? "primary" : "outline"}
              onClick={() => onAction(order.orderId, action)}
              className={styles.actionsBtn}
            >
              {actionLabels[action]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
