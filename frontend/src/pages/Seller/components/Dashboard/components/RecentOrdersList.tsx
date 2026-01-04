import Icon from '@/shared/components/Icon';
import { RecentOrder } from '@/types/seller';
import { getOrderStatusText } from '@/shared/utils/orderUtils';
import styles from './RecentOrdersList.module.scss';

interface RecentOrdersListProps {
  orders: RecentOrder[];
  onOrderClick: (orderId: string) => void;
}

function RecentOrdersList({ orders, onOrderClick }: RecentOrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon="receipt" />
        <p>尚無訂單</p>
      </div>
    );
  }

  return (
    <div className={styles.ordersList}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th>訂單編號</th>
            <th>買家</th>
            <th>商品數量</th>
            <th>金額</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} onClick={() => onOrderClick(order.id)}>
              <td className={styles.orderId}>{order.orderNumber}</td>
              <td>{order.buyerName}</td>
              <td>{order.itemCount} 項商品</td>
              <td className={styles.amount}>NT$ {order.totalAmount.toLocaleString()}</td>
              <td>
                <span className={`${styles.status} ${styles[order.status]}`}>
                  {getOrderStatusText(order.status)}
                </span>
              </td>
              <td>
                <Icon icon="chevron-right" className={styles.arrow} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentOrdersList;
