import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Dialog from '@/shared/components/Dialog';
import EmptyState from '@/shared/components/EmptyState';
import DiscountCard from '@/shared/components/DiscountCard';
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
          {discounts.map((discount) => (
            <DiscountCard
              key={discount.discountId}
              discount={{
                discountId: discount.discountId,
                discountCode: discount.discountCode,
                name: discount.name,
                discountType: 'special',
                discountRate: discount.discountRate,
                discountAmount: undefined,
                minPurchaseAmount: discount.minPurchaseAmount,
                maxDiscountAmount: discount.maxDiscountAmount,
                startDatetime: discount.startDatetime,
                endDatetime: discount.endDatetime,
                isActive: discount.isActive,
                usageCount: discount.usageCount,
                usageLimit: discount.usageLimit ?? null,
              }}
              onEdit={(id) => navigate(`/seller/discount/edit/${id}`)}
              onToggleStatus={handleToggleStatus}
              onDelete={(id, name) =>
                setDeleteDialog({
                  isOpen: true,
                  discountId: id,
                  discountName: name,
                  isSubmitting: false,
                })
              }
            />
          ))}
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
