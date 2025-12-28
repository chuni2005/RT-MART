import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Dialog from '@/shared/components/Dialog';
import EmptyState from '@/shared/components/EmptyState';
import sellerService from '@/shared/services/sellerService';
import { Discount } from '@/types/seller';
import styles from './DiscountList.module.scss';

function DiscountList() {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    isSubmitting: boolean;
    discountId: string;
    discountName: string;
  }>({ isOpen: false, isSubmitting: false, discountId: '', discountName: '' });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await sellerService.getDiscounts();
      setDiscounts(data);
    } catch (error) {
      console.error('載入折扣失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (discountId: string, isActive: boolean) => {
    try {
      await sellerService.updateDiscountStatus(discountId, !isActive);
      setDiscounts(
        discounts.map((d) =>
          d.discountId === discountId ? { ...d, isActive: !isActive } : d
        )
      );
    } catch (error) {
      console.error('更新折扣狀態失敗:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await sellerService.deleteDiscount(deleteDialog.discountId);
      setDiscounts(discounts.filter((d) => d.discountId !== deleteDialog.discountId));
      setDeleteDialog({ isOpen: false, isSubmitting: false, discountId: '', discountName: '' });
    } catch (error) {
      console.error('刪除折扣失敗:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  const isActive = (discount: Discount) => {
    const now = new Date();
    const start = new Date(discount.startDatetime);
    const end = new Date(discount.endDatetime);
    return discount.isActive && now >= start && now <= end;
  };

  const getDiscountStatus = (discount: Discount) => {
    const now = new Date();
    const start = new Date(discount.startDatetime);
    const end = new Date(discount.endDatetime);

    if (!discount.isActive) return '已停用';
    if (now < start) return '未開始';
    if (now > end) return '已結束';
    return '進行中';
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      進行中: '#28a745',
      未開始: '#ffc107',
      已結束: '#6c757d',
      已停用: '#dc3545',
    };
    return colorMap[status] || '#6c757d';
  };

  return (
    <div className={styles.discountList}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>折扣管理</h1>
        <Button onClick={() => navigate('/seller/discount/new')}>
          <Icon icon="plus" />
          新增折扣
        </Button>
      </div>

      {discounts.length === 0 ? (
        <EmptyState
          icon="tags"
          title="尚無折扣活動"
          message="點擊「新增折扣」開始建立您的第一個折扣活動"
        />
      ) : (
        <div className={styles.discountsGrid}>
          {discounts.map((discount) => {
            const status = getDiscountStatus(discount);
            return (
              <div key={discount.discountId} className={styles.discountCard}>
                {/* 卡片標題 */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.discountName}>{discount.name}</h3>
                  <span
                    className={styles.status}
                    style={{ color: getStatusColor(status) }}
                  >
                    {status}
                  </span>
                </div>

                {/* 折扣碼 */}
                <div className={styles.discountCode}>
                  <Icon icon="ticket" />
                  <span>{discount.discountCode}</span>
                </div>

                {/* 折扣資訊 */}
                <div className={styles.discountInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>折扣率</span>
                    <span className={styles.value}>
                      {(discount.discountRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>最低消費</span>
                    <span className={styles.value}>
                      NT$ {discount.minPurchaseAmount.toLocaleString()}
                    </span>
                  </div>
                  {discount.maxDiscountAmount && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>最高折抵</span>
                      <span className={styles.value}>
                        NT$ {discount.maxDiscountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* 有效期間 */}
                <div className={styles.period}>
                  <Icon icon="calendar" />
                  <div className={styles.periodText}>
                    <div>
                      {new Date(discount.startDatetime).toLocaleDateString(
                        "zh-TW"
                      )}
                    </div>
                    <div>~</div>
                    <div>
                      {new Date(discount.endDatetime).toLocaleDateString(
                        "zh-TW"
                      )}
                    </div>
                  </div>
                </div>

                {/* 使用情況 */}
                <div className={styles.usage}>
                  <div className={styles.usageBar}>
                    <div
                      className={styles.usageProgress}
                      style={{
                        width: discount.usageLimit
                          ? `${
                              (discount.usageCount / discount.usageLimit) * 100
                            }%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className={styles.usageText}>
                    已使用 {discount.usageCount}
                    {discount.usageLimit && ` / ${discount.usageLimit}`} 次
                  </span>
                </div>

                {/* 操作按鈕 */}
                <div className={styles.cardActions}>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/seller/discount/edit/${discount.discountId}`)
                    }
                  >
                    <Icon icon="pen-to-square" />
                    編輯
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleToggleStatus(discount.discountId, discount.isActive)
                    }
                  >
                    <Icon
                      icon={discount.isActive ? "toggle-on" : "toggle-off"}
                    />
                    {discount.isActive ? "停用" : "啟用"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        isSubmitting: false,
                        discountId: discount.discountId,
                        discountName: discount.name,
                      })
                    }
                  >
                    <Icon icon="trash" />
                    刪除
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 刪除確認對話框 */}
      <Dialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          !deleteDialog.isSubmitting &&
          setDeleteDialog({
            isOpen: false,
            discountId: '',
            discountName: '',
            isSubmitting: false,
          })
        }
        onConfirm={handleDelete}
        variant="warning"
        message={`確定要刪除折扣「${deleteDialog.discountName}」嗎？`}
        title="確認刪除"
      >
        <div className={styles.deleteDialog}>
          <p>確定要刪除折扣「{deleteDialog.discountName}」嗎？</p>
          <p className={styles.warning}>此操作無法復原。</p>
          {/* <div className={styles.dialogActions}>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ isOpen: false, discountId: '', discountName: '' })
              }
            >
              取消
            </Button>
            <Button onClick={handleDelete}>確認刪除</Button>
          </div> */}
        </div>
      </Dialog>
    </div>
  );
}

export default DiscountList;
