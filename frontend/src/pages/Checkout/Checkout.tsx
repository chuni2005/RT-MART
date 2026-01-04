import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Checkout.module.scss";
import CheckoutSummary from "@/shared/components/CheckoutSummary";
import Button from "@/shared/components/Button";
import Dialog from "@/shared/components/Dialog";
import AddressCard from "./components/AddressCard";
import AddressSelectionDialog from "./components/AddressSelectionDialog";
import AddressFormDialog, {
  type AddressFormData,
} from "./components/AddressFormDialog";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import StoreOrderSection from "./components/StoreOrderSection";
import DiscountSelectionDialog from "./components/DiscountSelectionDialog";
import type { CartItem, Address } from "@/types";
import type {
  PaymentMethod,
  CreateOrderRequest,
  CreateMultipleOrdersResponse,
  ManualDiscountSelection,
} from "@/types/order";
import {
  getAddresses,
  getDefaultAddress,
  addAddress,
} from "@/shared/services/addressService";
import { createOrder } from "@/shared/services/orderService";
import {
  getRecommendedDiscounts,
  getAllAvailableDiscounts,
} from "@/shared/services/discountService";
import { calculateDiscountAmounts } from "@/shared/utils/discountCalculator";
import { groupOrdersByStore } from "@/shared/utils/groupOrdersByStore";
import { useCart } from "@/shared/contexts/CartContext";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();

  // 從購物車傳來的選取商品
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // 收件地址
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // 付款方式
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );

  // 商店備註（每個商店獨立）
  const [storeNotes, setStoreNotes] = useState<Map<string, string>>(new Map());

  // 載入狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog 狀態
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showAddressFormDialog, setShowAddressFormDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderResponse, setOrderResponse] =
    useState<CreateMultipleOrdersResponse | null>(null);

  // 優惠碼狀態
  const [appliedDiscounts, setAppliedDiscounts] =
    useState<ManualDiscountSelection | null>(null);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [hasUserInteractedWithDiscounts, setHasUserInteractedWithDiscounts] =
    useState(false);

  // 按商店分組
  const storeGroups = useMemo(
    () => groupOrdersByStore(checkoutItems),
    [checkoutItems]
  );

  // 初始化
  useEffect(() => {
    const initCheckout = async () => {
      try {
        setIsLoading(true);

        // 1. 獲取購物車傳來的商品和折扣
        const items = location.state?.items as CartItem[] | undefined;
        const cartDiscounts = location.state?.appliedDiscounts as
          | ManualDiscountSelection
          | undefined;

        if (!items || items.length === 0) {
          // 沒有商品，導回購物車
          navigate("/cart", { replace: true });
          return;
        }
        setCheckoutItems(items);

        // 如果購物車有選擇折扣，使用購物車的折扣，並標記為已互動
        if (
          cartDiscounts &&
          (cartDiscounts.shipping ||
            cartDiscounts.seasonal ||
            cartDiscounts.special)
        ) {
          setAppliedDiscounts(cartDiscounts);
          setHasUserInteractedWithDiscounts(true);
        }

        // 2. 獲取預設地址和所有地址
        const [defaultAddr, allAddresses] = await Promise.all([
          getDefaultAddress(),
          getAddresses(),
        ]);

        if (defaultAddr) setSelectedAddress(defaultAddr);
        setAddresses(allAddresses);
      } catch (error) {
        console.error("Failed to initialize checkout:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initCheckout();
  }, [location.state, navigate]);

  // 初始化商店備註
  useEffect(() => {
    const initialNotes = new Map<string, string>();
    storeGroups.forEach((group) => {
      initialNotes.set(group.storeId, "");
    });
    setStoreNotes(initialNotes);
  }, [storeGroups]);

  // 自動載入推薦優惠（僅首次，且用戶未互動過）
  useEffect(() => {
    if (storeGroups.length === 0) return;

    // 如果用戶已經互動過折扣（從購物車帶過來或手動選擇過），不要自動套用
    if (hasUserInteractedWithDiscounts) return;

    // 如果已經有折扣（從購物車帶過來的），不要覆蓋
    if (
      appliedDiscounts &&
      (appliedDiscounts.shipping ||
        appliedDiscounts.seasonal ||
        appliedDiscounts.special)
    ) {
      return;
    }

    const loadDiscounts = async () => {
      try {
        const subtotal = storeGroups.reduce((sum, g) => sum + g.subtotal, 0);
        const storeIds = storeGroups.map((g) => g.storeId);

        const recommendation = await getRecommendedDiscounts(
          subtotal,
          storeIds
        );

        if (recommendation.totalSavings > 0) {
          // 轉換為新格式（分離 seasonal 和 special）
          const manualSelection: ManualDiscountSelection = {
            shipping: recommendation.shipping,
            seasonal:
              recommendation.product?.type === "seasonal"
                ? {
                    code: recommendation.product.code,
                    name: recommendation.product.name,
                    amount: Math.floor(recommendation.product.amount),
                  }
                : null,
            special:
              recommendation.product?.type === "special"
                ? {
                    code: recommendation.product.code,
                    name: recommendation.product.name,
                    amount: Math.floor(recommendation.product.amount),
                  }
                : null,
          };
          setAppliedDiscounts(manualSelection);
          // 不設置 hasUserInteractedWithDiscounts，因為這是自動推薦，不是用戶主動選擇
        }
      } catch (error) {
        console.error("Failed to load discount recommendations:", error);
        // 靜默失敗 - 用戶仍可繼續結帳
      }
    };

    loadDiscounts();
  }, [storeGroups, appliedDiscounts, hasUserInteractedWithDiscounts]);

  // 變更地址
  const handleChangeAddress = () => {
    setShowAddressDialog(true);
  };

  // 選擇地址
  const handleSelectAddress = (addressId: string) => {
    const address = addresses.find((addr) => addr.id === addressId);
    if (address) {
      setSelectedAddress(address);
    }
  };

  // 新增地址
  const handleAddNewAddress = () => {
    setShowAddressDialog(false);
    setShowAddressFormDialog(true);
  };

  // 提交新地址
  const handleSubmitNewAddress = async (addressData: AddressFormData) => {
    try {
      const newAddress = await addAddress(addressData);
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddress(newAddress);
    } catch (error) {
      console.error("Failed to add address:", error);
      alert("新增地址失敗");
    }
  };

  // 備註變更處理
  const handleNoteChange = (storeId: string, note: string) => {
    setStoreNotes((prev) => {
      const updated = new Map(prev);
      updated.set(storeId, note);
      return updated;
    });
  };

  // 處理折扣選擇確認
  const handleDiscountConfirm = async (selections: {
    shipping: string | null;
    product: string | null;
  }) => {
    try {
      const subtotal = storeGroups.reduce((sum, g) => sum + g.subtotal, 0);
      const storeIds = storeGroups.map((g) => g.storeId);

      // 獲取所有可用折扣以計算實際金額
      const allDiscounts = await getAllAvailableDiscounts(subtotal, storeIds);

      // 使用共用的折扣計算函數
      const newSelection = calculateDiscountAmounts(
        selections,
        allDiscounts,
        subtotal
      );

      setAppliedDiscounts(newSelection);
      // 標記用戶已經手動選擇過折扣，之後不再自動推薦
      setHasUserInteractedWithDiscounts(true);
    } catch (error) {
      console.error("Failed to apply discounts:", error);
      alert("套用折扣失敗，請稍後再試");
    }
  };

  // 確認訂單
  const handleConfirmOrder = async () => {
    if (!selectedAddress) {
      alert("請選擇收件地址");
      return;
    }

    if (!paymentMethod) {
      alert("請選擇付款方式");
      return;
    }

    try {
      setIsSubmitting(true);

      // 合併所有商店備註（因後端只接受單一 note 字段）
      const combinedNotes = Array.from(storeNotes.entries())
        .filter(([_, note]) => note.trim())
        .map(([storeId, note]) => {
          const storeName = storeGroups.find(
            (g) => g.storeId === storeId
          )?.storeName;
          return `【${storeName}】${note}`;
        })
        .join("\n");

      const orderData: CreateOrderRequest = {
        addressId: selectedAddress.id,
        paymentMethod: paymentMethod,
        note: combinedNotes || undefined,
        discountCodes: appliedDiscounts
          ? {
              shipping: appliedDiscounts.shipping?.code,
              product:
                appliedDiscounts.seasonal?.code ||
                appliedDiscounts.special?.code,
            }
          : undefined,
      };

      const response = await createOrder(orderData);

      // 刷新購物車狀態（後端已自動移除已選商品）
      await refreshCart();

      // 顯示成功 Dialog
      setOrderResponse(response);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to create order:", error);
      alert(error instanceof Error ? error.message : "訂單建立失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 成功 Dialog 確認
  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    navigate("/", { replace: true });
  };

  // 倒數計時狀態
  const [countdown, setCountdown] = useState(5);

  // 訂單成功後倒數計時
  useEffect(() => {
    if (showSuccessDialog) {
      setCountdown(5); // 重置倒數

      // 每秒更新倒數
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 5 秒後自動跳轉
      const timer = setTimeout(() => {
        handleSuccessConfirm();
      }, 5000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(timer);
      };
    }
  }, [showSuccessDialog]);

  // Loading 狀態
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        {/* 左側：訂單資訊 */}
        <div className={styles.checkoutContent}>
          {/* 1. 訂單明細（按商店分組） */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>訂單明細</h2>
            {storeGroups.map((group) => (
              <StoreOrderSection
                key={group.storeId}
                storeGroup={group}
                note={storeNotes.get(group.storeId) || ""}
                onNoteChange={handleNoteChange}
              />
            ))}
          </section>

          {/* 2. 收件地址（共用） */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>收件地址</h2>
              <Button
                variant="outline"
                onClick={handleChangeAddress}
                className={styles.changeBtn}
              >
                變更地址
              </Button>
            </div>

            {selectedAddress ? (
              <AddressCard
                address={selectedAddress}
                isDefault={selectedAddress.isDefault}
              />
            ) : (
              <div className={styles.noAddress}>
                <p>尚未設定收件地址</p>
                <Button variant="primary" onClick={handleChangeAddress}>
                  新增地址
                </Button>
              </div>
            )}
          </section>

          {/* 3. 付款方式（共用） */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>付款方式</h2>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </section>
        </div>

        {/* 右側：訂單摘要 */}
        <CheckoutSummary
          storeGroups={storeGroups}
          appliedDiscounts={appliedDiscounts}
          onCheckout={handleConfirmOrder}
          onDiscountChange={() => setShowDiscountDialog(true)}
          disabled={isSubmitting || !selectedAddress || !paymentMethod}
          buttonText={isSubmitting ? "處理中..." : "確認訂單"}
        />
      </div>

      {/* 地址選擇 Dialog */}
      <AddressSelectionDialog
        isOpen={showAddressDialog}
        onClose={() => setShowAddressDialog(false)}
        addresses={addresses}
        currentAddressId={selectedAddress?.id || null}
        onSelectAddress={handleSelectAddress}
        onAddNewAddress={handleAddNewAddress}
      />

      {/* 地址表單 Dialog */}
      <AddressFormDialog
        isOpen={showAddressFormDialog}
        onClose={() => setShowAddressFormDialog(false)}
        onSubmit={handleSubmitNewAddress}
        mode="add"
      />

      {/* 折扣選擇對話框 */}
      <DiscountSelectionDialog
        isOpen={showDiscountDialog}
        onClose={() => setShowDiscountDialog(false)}
        currentSelections={{
          shipping: appliedDiscounts?.shipping?.code || null,
          product:
            appliedDiscounts?.seasonal?.code ||
            appliedDiscounts?.special?.code ||
            null,
        }}
        onConfirm={handleDiscountConfirm}
        subtotal={storeGroups.reduce((sum, g) => sum + g.subtotal, 0)}
        storeIds={storeGroups.map((g) => g.storeId)}
      />

      {/* 訂單成功 Dialog */}
      <Dialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessConfirm}
        type="alert"
        variant="info"
        icon="check-circle"
        title="訂單建立成功！"
        message={
          orderResponse ? (
            <>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  marginBottom: "0.5rem",
                }}
              >
                已成功建立 {orderResponse.orders.length} 筆訂單
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  backgroundColor: "#f8f9fa",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                {orderResponse.orders.map((order) => (
                  <div
                    key={order.orderId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#333" }}>
                        {order.storeName}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                        單號: {order.orderNumber || order.orderId}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: "#e44d26" }}>
                      $ {order.totalAmount.toLocaleString()}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: "0.75rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px dashed #dee2e6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  <span>總計金額</span>
                  <span style={{ color: "#e44d26" }}>
                    $ {orderResponse.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.25rem",
                  fontSize: "0.875rem",
                  color: "#6c757d",
                  textAlign: "center",
                }}
              >
                {countdown} 秒後自動返回首頁...
              </div>
            </>
          ) : (
            "我們將盡快為您處理訂單"
          )
        }
      />
    </div>
  );
}

export default Checkout;
