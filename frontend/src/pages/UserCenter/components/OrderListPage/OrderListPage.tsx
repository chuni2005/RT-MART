import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Tab from "@/shared/components/Tab";
import OrderCard from "../OrderCard";
import EmptyState from "@/shared/components/EmptyState";
import Dialog from "@/shared/components/Dialog";
import Alert from "@/shared/components/Alert";
import { AlertType, OrderListItem, OrderStatus } from "@/types";
import { OrderAction } from "@/types/userCenter";
import {
  getOrders,
  cancelOrder,
  confirmDelivery,
  getOrderDetail,
} from "@/shared/services/orderService";
import cartService from "@/shared/services/cartService";
import { useAuth } from "@/shared/contexts/AuthContext";
import styles from "./OrderListPage.module.scss";

/**
 * 訂單列表頁面
 */
function OrderListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // SECURITY: Defense in depth - block admin access even if routing fails
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  const alertRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    orderId: string;
    action: OrderAction;
    title: string;
    message: string;
  } | null>(null);
  const [alert, setAlert] = useState<{
    type: AlertType;
    message: string;
  } | null>(null);

  const showAlert = (
    alertData: { type: AlertType; message: string } | null
  ) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  };

  // Tab 項目定義
  const tabItems = [
    { key: "all", label: "全部訂單" },
    { key: "pending_payment", label: "待付款" },
    { key: "processing", label: "處理中" },
    { key: "shipped", label: "已出貨" },
    { key: "delivered", label: "已送達" },
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

  // 處理再買一次
  const handleReorder = async (orderId: string) => {
    try {
      setIsProcessing(orderId);

      // 取得該訂單詳細資訊（包含商品列表）
      const order = await getOrderDetail(orderId);

      if (!order.items || order.items.length === 0) {
        throw new Error("此訂單沒有可重新購買的商品。");
      }

      // 將所有商品重新加入購物車
      const addTasks = order.items.map((item) =>
        cartService.addToCart(item.productId, item.quantity)
      );

      // 等待所有 API 請求完成
      const results = await Promise.all(addTasks);

      // 檢查是否所有商品都成功加入
      const failedTask = results.find((r) => !r.success);
      if (failedTask) {
        throw new Error(
          failedTask.message || "部分商品庫存不足，無法加入購物車。"
        );
      }

      showAlert({
        type: "success",
        message: "已將訂單商品加入購物車！正在前往購物車...",
      });

      // 導向購物車頁面
      setTimeout(() => {
        navigate("/cart");
      }, 800);
    } catch (error) {
      console.error("Reorder failed:", error);
      showAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : "再買一次失敗，請稍後再試。",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  // 處理訂單操作
  const handleAction = (orderId: string, action: OrderAction) => {
    switch (action) {
      case "confirm":
        // 確認收貨 - 顯示確認對話框
        setConfirmDialog({
          isOpen: true,
          orderId,
          action,
          title: "確認收貨",
          message: "確認已收到商品？確認後訂單將完成。",
        });
        break;

      case "cancel":
        // 取消訂單 - 顯示確認對話框
        setConfirmDialog({
          isOpen: true,
          orderId,
          action,
          title: "取消訂單",
          message: "確定要取消此訂單嗎？此操作無法復原。",
        });
        break;

      case "pay":
        // TODO: 後續跳出 dialog 讓用戶信用卡支付
        showAlert({
          type: "error",
          message: "付款功能開發中，敬請期待。",
        });
        break;

      case "review":
        showAlert({
          type: "error",
          message: "此功能尚未開放，敬請期待。",
        });
        break;
      case "reorder":
        handleReorder(orderId);
        break;

      default:
        console.warn("Unknown action:", action);
    }
  };

  // 確認處理函數
  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    const { orderId, action } = confirmDialog;

    try {
      setIsProcessing(orderId);
      setConfirmDialog(null); // 立即關閉對話框

      switch (action) {
        case "confirm":
          await confirmDelivery(orderId);
          showAlert({
            type: "success",
            message: "已確認收貨，訂單完成！",
          });
          break;

        case "cancel":
          await cancelOrder(orderId);
          showAlert({
            type: "success",
            message: "訂單已成功取消。",
          });
          break;
      }

      // 刷新訂單列表
      await fetchOrders();
    } catch (error) {
      console.error("Order action failed:", error);
      showAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : "操作失敗，請稍後再試。",
      });
    } finally {
      setIsProcessing(null);
    }
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

      {/* 提示訊息 */}
      {alert && (
        <div ref={alertRef}>
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

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
              isProcessing={isProcessing === order.orderId}
            />
          ))
        ) : (
          <EmptyState type="order" icon="receipt" title="暫無訂單" />
        )}
      </div>

      {/* 確認對話框 */}
      {confirmDialog && (
        <Dialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type="confirm"
          variant={confirmDialog.action === "cancel" ? "danger" : "info"}
          confirmText="確定"
          cancelText="取消"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

export default OrderListPage;
