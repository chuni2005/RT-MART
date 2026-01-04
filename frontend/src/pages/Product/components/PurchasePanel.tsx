import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PurchasePanel.module.scss";
import Button from "@/shared/components/Button/Button";
import Alert from "@/shared/components/Alert/Alert";
import QuantitySelector from "@/shared/components/QuantitySelector";
import { useAuth } from "@/shared/hooks/useAuth";
import { useCart } from "@/shared/contexts/CartContext";

interface PurchasePanelProps {
  stock: number;
  productId: number | string;
}

interface AlertState {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

function PurchasePanel({ stock, productId }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  // 顯示 Alert 提示
  const showAlert = (type: AlertState["type"], message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  // 處理數量變化
  const handleQuantityChange = (newQuantity: number | string) => {
    setQuantity(newQuantity);
  };

  // 處理驗證錯誤
  const handleValidationError = (message: string) => {
    showAlert("error", message);
  };

  // 加入購物車
  const handleAddToCart = async () => {
    // 檢查是否登入
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: `/product/${productId}` } });
      return;
    }

    // 檢查庫存
    if (stock === 0) {
      showAlert("error", "商品已售完");
      return;
    }

    const qty =
      typeof quantity === "string" ? parseInt(quantity, 10) : quantity;
    if (isNaN(qty) || qty <= 0) {
      showAlert("error", "請輸入有效的數量");
      return;
    }

    try {
      setIsAddingToCart(true);
      // 使用 CartContext 的 addToCart，它會自動更新 Header 的購物車數量
      // 使用者要求 handleAddToCart 時，selected 為 false
      await addToCart(productId.toString(), qty, false);

      showAlert("success", `成功加入 ${qty} 件商品到購物車`);

      // 重置數量為1
      setQuantity(1);
    } catch (error: any) {
      console.error("Add to cart failed:", error);
      showAlert("error", error.message || "加入購物車失敗，請稍後再試");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // 立即購買：加入購物車並勾選，然後跳轉到購物車頁面
  const handleBuyNow = async () => {
    // 檢查是否登入
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: `/product/${productId}` } });
      return;
    }

    // 檢查庫存
    if (stock === 0) {
      showAlert("error", "商品已售完");
      return;
    }

    const qty =
      typeof quantity === "string" ? parseInt(quantity, 10) : quantity;
    if (isNaN(qty) || qty <= 0) {
      showAlert("error", "請輸入有效的數量");
      return;
    }

    try {
      setIsBuyingNow(true);
      // 立即購買時，selected 為 true
      await addToCart(productId.toString(), qty, true);

      // 跳轉到購物車頁面
      navigate("/cart");
    } catch (error: any) {
      console.error("Buy now failed:", error);
      showAlert("error", error.message || "立即購買失敗，請稍後再試");
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <div className={styles.purchasePanel}>
      {/* 數量選擇器 */}
      <div className={styles.quantitySection}>
        <label className={styles.quantityLabel}>數量</label>
        <QuantitySelector
          value={quantity}
          onChange={handleQuantityChange}
          max={stock}
          min={1}
          disabled={stock === 0}
          onValidationError={handleValidationError}
          size="lg"
        />
        <span className={styles.stockHint}>可購買 {stock} 件</span>
      </div>

      {/* 操作按鈕 */}
      <div className={styles.actionButtons}>
        <Button
          variant="outline"
          onClick={handleAddToCart}
          disabled={stock === 0 || isAddingToCart}
          icon={isAddingToCart ? undefined : "shopping-cart"}
          fullWidth
          className={styles.addToCartButton}
        >
          {isAddingToCart ? "加入中..." : "加入購物車"}
        </Button>

        <Button
          variant="primary"
          onClick={handleBuyNow}
          disabled={stock === 0 || isBuyingNow}
          fullWidth
          className={styles.buyNowButton}
        >
          {isBuyingNow ? "處理中..." : "立即購買"}
        </Button>
      </div>

      {/* Alert 提示 */}
      {alert && (
        <div className={styles.alertContainer}>
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {/* 庫存不足提示 */}
      {stock === 0 && (
        <div className={styles.outOfStockNotice}>此商品已售完</div> // TODO: i18n
      )}
    </div>
  );
}

export default PurchasePanel;
