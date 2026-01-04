import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Dialog from '@/shared/components/Dialog';
import Alert from '@/shared/components/Alert';
import Tab from '@/shared/components/Tab';
import DiscountCard from '@/shared/components/DiscountCard';
import adminService from '@/shared/services/adminService.index';
import { SystemDiscount } from '@/types/admin';
import { AlertType } from '@/types';
import styles from './Discounts.module.scss';

function Discounts() {
  const navigate = useNavigate();
  const alertRef = useRef<HTMLDivElement>(null);
  const [discounts, setDiscounts] = useState<SystemDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    discountId: string;
    discountName: string;
  }>({ isOpen: false, discountId: '', discountName: '' });

  // Tab items
  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'seasonal', label: '季節性折扣' },
    { key: 'shipping', label: '免運費' },
  ];

  // Custom setAlert with scroll behavior
  const showAlert = (alertData: { type: AlertType; message: string } | null) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, [activeTab]);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSystemDiscounts({
        type: activeTab === 'all' ? undefined : (activeTab as 'seasonal' | 'shipping'),
      });
      setDiscounts(data);
    } catch (error) {
      console.error('載入系統折扣失敗:', error);
      showAlert({ type: 'error', message: '載入系統折扣失敗' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (discountId: string, isActive: boolean) => {
    try {
      await adminService.updateSystemDiscountStatus(discountId, !isActive);
      setDiscounts(
        discounts.map((d) =>
          d.discount_id === discountId ? { ...d, is_active: !isActive } : d
        )
      );
      showAlert({ type: 'success', message: `已${!isActive ? '啟用' : '停用'}折扣` });
    } catch (error) {
      console.error('更新折扣狀態失敗:', error);
      showAlert({ type: 'error', message: '更新折扣狀態失敗' });
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteSystemDiscount(deleteDialog.discountId);
      setDiscounts(discounts.filter((d) => d.discount_id !== deleteDialog.discountId));
      setDeleteDialog({ isOpen: false, discountId: '', discountName: '' });
      showAlert({ type: 'success', message: '折扣已刪除' });
    } catch (error) {
      console.error('刪除折扣失敗:', error);
      showAlert({ type: 'error', message: '刪除折扣失敗' });
    }
  };


  return (
    <div className={styles.discounts}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>系統折扣設定</h1>
        <Button onClick={() => navigate('/admin/discount/new')}>
          <Icon icon="plus" />
          新增折扣
        </Button>
      </div>

      {/* Alert */}
      {alert && (
        <div ref={alertRef}>
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Tabs */}
      <Tab
        items={tabItems}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        className={styles.tabs}
      />

      {/* Loading State */}
      {loading && <div className={styles.loading}>載入中...</div>}

      {/* Empty State */}
      {!loading && discounts.length === 0 && (
        <div className={styles.emptyState}>
          <Icon icon="tags" />
          <p>目前沒有{activeTab === 'all' ? '' : activeTab === 'seasonal' ? '季節性' : '免運費'}折扣活動</p>
          <p className={styles.hint}>點擊「新增折扣」開始建立折扣活動</p>
        </div>
      )}

      {/* Discounts Grid */}
      {!loading && discounts.length > 0 && (
        <div className={styles.discountsGrid}>
          {discounts.map((discount) => (
            <DiscountCard
              key={discount.discount_id}
              discount={{
                discountId: discount.discount_id,
                discountCode: discount.discount_code,
                name: discount.name,
                discountType: discount.discount_type,
                discountRate: discount.discount_rate,
                discountAmount: discount.discount_amount,
                minPurchaseAmount: discount.min_purchase_amount,
                maxDiscountAmount: discount.max_discount_amount,
                startDatetime: discount.start_datetime,
                endDatetime: discount.end_datetime,
                isActive: discount.is_active,
                usageCount: discount.usage_count,
                usageLimit: discount.usage_limit,
              }}
              onEdit={(id) => navigate(`/admin/discount/edit/${id}`)}
              onToggleStatus={handleToggleStatus}
              onDelete={(id, name) =>
                setDeleteDialog({ isOpen: true, discountId: id, discountName: name })
              }
            />
          ))}
        </div>
      )}

      {/* 刪除確認對話框 */}
      <Dialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, discountId: '', discountName: '' })
        }
        title="確認刪除"
        type="custom"
      >
        <div className={styles.deleteDialog}>
          <p>確定要刪除折扣「{deleteDialog.discountName}」嗎？</p>
          <p className={styles.warning}>此操作無法復原。</p>
          <div className={styles.dialogActions}>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ isOpen: false, discountId: '', discountName: '' })
              }
            >
              取消
            </Button>
            <Button className={styles.btnDanger} onClick={handleDelete}>
              確認刪除
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Discounts;
