import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PurchasePanel.module.scss";
import Button from "@/shared/components/Button/Button";
import Alert from "@/shared/components/Alert/Alert";
import QuantitySelector from "@/shared/components/QuantitySelector";
import { useAuth } from "@/shared/hooks/useAuth";
import { Product } from "@/types";

interface PurchasePanelProps {
  stock: number;
  productId: number | string;
  productData: Product;
}

interface AlertState {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

function PurchasePanel({ stock, productId, productData }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
  const handleAddToCart = () => {
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

    // TODO: 實際的 API 請求加入購物車
    // await cartService.addToCart(productId, quantity);

    // 模擬成功
    showAlert("success", `成功加入 ${quantity} 件商品到購物車`);

    // 重置數量為1
    setQuantity(1);
  };

  // 立即購買
  const handleBuyNow = () => {
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

    // 跳轉到結帳頁面，攜帶商品資訊
    navigate("/checkout", {
      state: {
        products: [
          {
            ...productData,
            quantity:
              typeof quantity === "string" ? parseInt(quantity, 10) : quantity,
          },
        ],
      },
    });
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
          disabled={stock === 0}
          icon="shopping-cart"
          fullWidth
          className={styles.addToCartButton}
        >
          加入購物車
        </Button>

        <Button
          variant="primary"
          onClick={handleBuyNow}
          disabled={stock === 0}
          fullWidth
          className={styles.buyNowButton}
        >
          立即購買
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
