import { useState, useEffect } from 'react';
import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import Alert from '@/shared/components/Alert';
import styles from './DiscountSelectionDialog.module.scss';
import { getAllAvailableDiscounts } from '@/shared/services/discountService';
import type { AvailableDiscount } from '@/types/order';

interface DiscountSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSelections: {
    shipping: string | null;
    product: string | null;
  };
  onConfirm: (selections: {
    shipping: string | null;
    product: string | null;
  }) => void;
  subtotal: number;
  storeIds: string[];
}

function DiscountSelectionDialog({
  isOpen,
  onClose,
  currentSelections,
  onConfirm,
  subtotal,
  storeIds,
}: DiscountSelectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingDiscounts, setShippingDiscounts] = useState<AvailableDiscount[]>([]);
  const [productDiscounts, setProductDiscounts] = useState<AvailableDiscount[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(currentSelections.shipping);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(currentSelections.product);

  // 載入可用折扣
  useEffect(() => {
    if (isOpen) {
      loadAvailableDiscounts();
      // 重置選擇為當前值
      setSelectedShipping(currentSelections.shipping);
      setSelectedProduct(currentSelections.product);
    }
  }, [isOpen, subtotal, storeIds]);

  const loadAvailableDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const discounts = await getAllAvailableDiscounts(subtotal, storeIds);

      // 分離運費折扣和商品折扣
      setShippingDiscounts(
        discounts.filter(d => d.discountType === 'shipping')
      );
      setProductDiscounts(
        discounts.filter(d =>
          d.discountType === 'seasonal' || d.discountType === 'special'
        )
      );
    } catch (err) {
      setError('載入折扣失敗，請稍後再試');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      shipping: selectedShipping,
      product: selectedProduct,
    });
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
  };

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getDiscountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      seasonal: '季節折扣',
      special: '特別活動',
    };
    return labels[type] || type;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="選擇折扣"
      type="custom"
      className={styles.discountDialog}
    >
      <div className={styles.dialogContent}>
        {loading && <div className={styles.loading}>載入中...</div>}

        {error && <Alert type="error" message={error} />}

        {!loading && !error && (
          <>
            {/* 運費折扣區 */}
            <section className={styles.discountSection}>
              <h4>運費折扣</h4>
              <div className={styles.tableWrapper}>
                <table className={styles.discountTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>選擇</th>
                      <th>折扣名稱</th>
                      <th>折扣碼</th>
                      <th>折扣金額</th>
                      <th>最低消費</th>
                      <th>有效期限</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 不使用折扣選項 */}
                    <tr>
                      <td>
                        <input
                          type="radio"
                          name="shipping"
                          value=""
                          checked={selectedShipping === null}
                          onChange={() => setSelectedShipping(null)}
                        />
                      </td>
                      <td colSpan={5} className={styles.noDiscountOption}>
                        不使用運費折扣
                      </td>
                    </tr>

                    {/* 可用折扣列表 */}
                    {shippingDiscounts.map(discount => (
                      <tr key={discount.discountId}>
                        <td>
                          <input
                            type="radio"
                            name="shipping"
                            value={discount.discountCode}
                            checked={selectedShipping === discount.discountCode}
                            onChange={() => setSelectedShipping(discount.discountCode)}
                          />
                        </td>
                        <td>{discount.name}</td>
                        <td><code>{discount.discountCode}</code></td>
                        <td className={styles.discountAmount}>
                          -${Math.floor(discount.shippingDiscount?.discountAmount || 0)}
                        </td>
                        <td>${discount.minPurchaseAmount}</td>
                        <td className={styles.dateRange}>
                          {formatDateRange(discount.startDatetime, discount.endDatetime)}
                        </td>
                      </tr>
                    ))}

                    {shippingDiscounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.emptyMessage}>
                          目前沒有可用的運費折扣
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 商品折扣區 */}
            <section className={styles.discountSection}>
              <h4>商品折扣</h4>
              <div className={styles.tableWrapper}>
                <table className={styles.discountTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>選擇</th>
                      <th>折扣名稱</th>
                      <th>折扣碼</th>
                      <th>折扣類型</th>
                      <th>折扣率</th>
                      <th>上限金額</th>
                      <th>最低消費</th>
                      <th>有效期限</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 不使用折扣選項 */}
                    <tr>
                      <td>
                        <input
                          type="radio"
                          name="product"
                          value=""
                          checked={selectedProduct === null}
                          onChange={() => setSelectedProduct(null)}
                        />
                      </td>
                      <td colSpan={7} className={styles.noDiscountOption}>
                        不使用商品折扣
                      </td>
                    </tr>

                    {/* 可用折扣列表 */}
                    {productDiscounts.map(discount => {
                      const rate = discount.seasonalDiscount?.discountRate || discount.specialDiscount?.discountRate || 0;
                      const maxAmount = discount.seasonalDiscount?.maxDiscountAmount || discount.specialDiscount?.maxDiscountAmount;

                      return (
                        <tr key={discount.discountId}>
                          <td>
                            <input
                              type="radio"
                              name="product"
                              value={discount.discountCode}
                              checked={selectedProduct === discount.discountCode}
                              onChange={() => setSelectedProduct(discount.discountCode)}
                            />
                          </td>
                          <td>{discount.name}</td>
                          <td><code>{discount.discountCode}</code></td>
                          <td>
                            <span className={styles.discountType}>
                              {getDiscountTypeLabel(discount.discountType)}
                            </span>
                          </td>
                          <td>{(rate * 100).toFixed(1)}%</td>
                          <td>
                            {maxAmount ? `$${maxAmount}` : '無上限'}
                          </td>
                          <td>${discount.minPurchaseAmount}</td>
                          <td className={styles.dateRange}>
                            {formatDateRange(discount.startDatetime, discount.endDatetime)}
                          </td>
                        </tr>
                      );
                    })}

                    {productDiscounts.length === 0 && (
                      <tr>
                        <td colSpan={8} className={styles.emptyMessage}>
                          目前沒有可用的商品折扣
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Footer Buttons */}
      <div className={styles.dialogFooter}>
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={loading}>
          確認
        </Button>
      </div>
    </Dialog>
  );
}

export default DiscountSelectionDialog;
