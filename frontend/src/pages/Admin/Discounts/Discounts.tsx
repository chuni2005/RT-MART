import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Dialog from '@/shared/components/Dialog';
import Alert from '@/shared/components/Alert';
import Tab from '@/shared/components/Tab';
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

  const getDiscountStatus = (discount: SystemDiscount) => {
    const now = new Date();
    const start = new Date(discount.start_datetime);
    const end = new Date(discount.end_datetime);

    if (!discount.is_active) return '已停用';
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

  const getDiscountTypeLabel = (type: 'seasonal' | 'shipping') => {
    return type === 'seasonal' ? '季節性折扣' : '免運費';
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
          {discounts.map((discount) => {
            const status = getDiscountStatus(discount);
            return (
              <div key={discount.discount_id} className={styles.discountCard}>
                {/* 卡片標題 */}
                <div className={styles.cardHeader}>
                  <div className={styles.titleSection}>
                    <h3 className={styles.discountName}>{discount.name}</h3>
                    <span className={styles.discountType}>
                      {getDiscountTypeLabel(discount.discount_type)}
                    </span>
                  </div>
                  <span
                    className={styles.status}
                    style={{ color: getStatusColor(status) }}
                  >
                    {status}
                  </span>
                </div>

                {/* 折扣資訊 */}
                <div className={styles.discountInfo}>
                  {discount.discount_type === 'seasonal' && (
                    <>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>折扣率</span>
                        <span className={styles.value}>
                          {((discount.discount_rate || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      {discount.max_discount_amount && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>最高折抵</span>
                          <span className={styles.value}>
                            NT$ {discount.max_discount_amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {discount.discount_type === 'shipping' && discount.discount_amount && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>折抵金額</span>
                      <span className={styles.value}>
                        NT$ {discount.discount_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <span className={styles.label}>最低消費</span>
                    <span className={styles.value}>
                      NT$ {discount.min_purchase_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 有效期間 */}
                <div className={styles.period}>
                  <Icon icon="calendar" />
                  <div className={styles.periodText}>
                    <div>
                      {new Date(discount.start_datetime).toLocaleDateString('zh-TW')}
                    </div>
                    <div>~</div>
                    <div>
                      {new Date(discount.end_datetime).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className={styles.cardActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/admin/discount/edit/${discount.discount_id}`)
                    }
                  >
                    <Icon icon="pen-to-square" />
                    編輯
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleStatus(discount.discount_id, discount.is_active)
                    }
                  >
                    <Icon icon={discount.is_active ? 'toggle-on' : 'toggle-off'} />
                    {discount.is_active ? '停用' : '啟用'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        discountId: discount.discount_id,
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
