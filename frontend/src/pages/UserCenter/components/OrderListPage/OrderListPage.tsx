import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Tab from "@/shared/components/Tab";
import OrderCard from "../OrderCard";
import EmptyState from "@/shared/components/EmptyState";
import { OrderListItem, OrderStatus } from "@/types/order";
import { OrderAction } from "@/types/userCenter";
import { getOrders } from "@/shared/services/orderService";
import styles from "./OrderListPage.module.scss";

/**
 * 訂單列表頁面
 */
function OrderListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab 項目定義
  const tabItems = [
    { key: "all", label: "全部訂單" },
    { key: "pending_payment", label: "待付款" },
    { key: "processing", label: "處理中" },
    { key: "shipped", label: "已出貨" },
    { key: "completed", label: "已完成" },
    { key: "cancelled", label: "已取消" },
  ];

  // 獲取訂單資料
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params =
        activeTab === "all" ? {} : { status: activeTab as OrderStatus };
      const response = await getOrders(params);
      setOrders(response.orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理查看詳情
  const handleViewDetail = (orderId: string) => {
    console.log("View order addressLine1:", orderId);
    navigate(`/user/orders/${orderId}`);
  };

  // 處理訂單操作
  const handleAction = (orderId: string, action: OrderAction) => {
    console.log("Order action:", orderId, action);
    // TODO: 實作訂單操作邏輯
  };

  return (
    <div className={styles.orderListPage}>
      <h1 className={styles.title}>我的訂單</h1>

      {/* Tab 切換 */}
      <Tab
        items={tabItems}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        className={styles.orderTabs}
      />

      {/* 訂單列表 */}
      <div className={styles.orderList}>
        {isLoading ? (
          <div className={styles.loading}>載入中...</div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onViewDetail={handleViewDetail}
              onAction={handleAction}
            />
          ))
        ) : (
          <EmptyState type="order" icon="receipt" title="暫無訂單" />
        )}
      </div>
    </div>
  );
}

export default OrderListPage;
