import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Checkout.module.scss';
import ItemListCard from '@/shared/components/ItemListCard';
import CheckoutSummary from '@/pages/Cart/components/CheckoutSummary';
import Button from '@/shared/components/Button';
import type { CartItem, Address } from '@/types';
import type { PaymentMethod } from '@/types/order';
import { getAddresses, getDefaultAddress } from '@/shared/services/addressService';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 從購物車傳來的選取商品
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // 收件地址
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // 付款方式
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // 訂單備註
  const [orderNote, setOrderNote] = useState('');

  // 載入狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 計算金額
  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems]
  );

  const shipping = subtotal >= 500 ? 0 : 60;
  const discount = 0; // TODO: 優惠券功能
  const total = subtotal + shipping - discount;

  // 初始化
  useEffect(() => {
    const initCheckout = async () => {
      try {
        setIsLoading(true);

        // 1. 獲取購物車傳來的商品
        const items = location.state?.items as CartItem[] | undefined;
        if (!items || items.length === 0) {
          // 沒有商品，導回購物車
          navigate('/cart', { replace: true });
          return;
        }
        setCheckoutItems(items);

        // 2. 獲取預設地址和所有地址
        const [defaultAddr, allAddresses] = await Promise.all([
          getDefaultAddress(),
          getAddresses(),
        ]);

        if (defaultAddr) setSelectedAddress(defaultAddr);
        setAddresses(allAddresses);
      } catch (error) {
        console.error('Failed to initialize checkout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initCheckout();
  }, [location.state, navigate]);

  // 變更地址
  const handleChangeAddress = () => {
    alert('地址選擇功能開發中...');
  };

  // 確認訂單
  const handleConfirmOrder = async () => {
    if (!selectedAddress) {
      alert('請選擇收件地址');
      return;
    }

    if (!paymentMethod) {
      alert('請選擇付款方式');
      return;
    }

    alert('訂單提交功能開發中...');
  };

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
          {/* 1. 商品清單 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>商品清單</h2>
            <div className={styles.itemList}>
              {checkoutItems.map((item) => (
                <ItemListCard
                  key={item.id}
                  variant="order-detail"
                  item={item}
                />
              ))}
            </div>
          </section>

          {/* 2. 收件地址 */}
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
              <div className={styles.addressDisplay}>
                <p className={styles.recipientInfo}>
                  <strong>{selectedAddress.recipientName}</strong>
                  <span>{selectedAddress.phone}</span>
                </p>
                <p className={styles.addressText}>
                  {selectedAddress.city} {selectedAddress.district} {selectedAddress.postalCode}
                  <br />
                  {selectedAddress.detail}
                </p>
              </div>
            ) : (
              <div className={styles.noAddress}>
                <p>尚未設定收件地址</p>
                <Button variant="primary" onClick={handleChangeAddress}>
                  新增地址
                </Button>
              </div>
            )}
          </section>

          {/* 3. 付款方式 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>付款方式</h2>
            <div className={styles.paymentMethods}>
              <div
                className={`${styles.methodCard} ${
                  paymentMethod === 'credit_card' ? styles.selected : ''
                }`}
                onClick={() => setPaymentMethod('credit_card')}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                />
                <div className={styles.methodContent}>
                  <h4>信用卡</h4>
                  <p>支援 Visa、Mastercard、JCB</p>
                </div>
              </div>

              <div
                className={`${styles.methodCard} ${
                  paymentMethod === 'cash_on_delivery' ? styles.selected : ''
                }`}
                onClick={() => setPaymentMethod('cash_on_delivery')}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                />
                <div className={styles.methodContent}>
                  <h4>貨到付款</h4>
                  <p>收到商品時以現金付款</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 訂單備註 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>訂單備註</h2>
            <textarea
              className={styles.noteTextarea}
              placeholder="給賣家的備註（選填，最多 200 字）"
              maxLength={200}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={4}
            />
            <div className={styles.charCount}>{orderNote.length} / 200</div>
          </section>
        </div>

        {/* 右側：訂單摘要 */}
        <div className={styles.checkoutSummary}>
          <CheckoutSummary
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            itemCount={checkoutItems.length}
            selectedCount={checkoutItems.length}
            freeShippingThreshold={500}
            onCheckout={handleConfirmOrder}
            disabled={isSubmitting || !selectedAddress || !paymentMethod}
            buttonText={isSubmitting ? '處理中...' : '確認訂單'}
          />
        </div>
      </div>
    </div>
  );
}

export default Checkout;
