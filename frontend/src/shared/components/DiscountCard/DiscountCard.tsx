import { useState } from 'react';
import Icon from '@/shared/components/Icon';
import Button from '@/shared/components/Button';
import styles from './DiscountCard.module.scss';

interface DiscountCardProps {
  discount: {
    discountId: string;
    discountCode: string;
    name: string;
    discountType?: 'seasonal' | 'shipping' | 'special';
    discountRate?: number;
    discountAmount?: number;
    minPurchaseAmount: number;
    maxDiscountAmount?: number;
    startDatetime: string;
    endDatetime: string;
    isActive: boolean;
    usageCount: number;
    usageLimit: number | null;
  };
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  onDelete?: (id: string, name: string) => void;
}

function DiscountCard({
  discount,
  onEdit,
  onToggleStatus,
  onDelete,
}: DiscountCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(discount.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const getDiscountStatus = () => {
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

  const status = getDiscountStatus();

  return (
    <div className={styles.discountCard}>
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

      {/* 折扣碼 - 可點擊複製 */}
      <div
        className={`${styles.discountCode} ${copied ? styles.copied : ''}`}
        onClick={handleCopyCode}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCopyCode();
          }
        }}
        title="點擊複製折扣碼"
      >
        <Icon icon="ticket" />
        <span className={styles.code}>{discount.discountCode}</span>
        <div className={styles.copyButton}>
          <Icon icon={copied ? "check" : "copy"} />
          {copied && <span className={styles.copiedText}>已複製</span>}
        </div>
      </div>

      {/* 折扣資訊 */}
      <div className={styles.discountInfo}>
        {discount.discountRate !== undefined && (
          <div className={styles.infoItem}>
            <span className={styles.label}>折扣率</span>
            <span className={styles.value}>
              {(discount.discountRate * 100).toFixed(0)}%
            </span>
          </div>
        )}
        {discount.discountAmount !== undefined && (
          <div className={styles.infoItem}>
            <span className={styles.label}>折抵金額</span>
            <span className={styles.value}>
              NT$ {discount.discountAmount.toLocaleString()}
            </span>
          </div>
        )}
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
          <div>{new Date(discount.startDatetime).toLocaleDateString('zh-TW')}</div>
          <div>~</div>
          <div>{new Date(discount.endDatetime).toLocaleDateString('zh-TW')}</div>
        </div>
      </div>

      {/* 使用情況 */}
      <div className={styles.usage}>
        <div className={styles.usageBar}>
          <div
            className={styles.usageProgress}
            style={{
              width: discount.usageLimit
                ? `${(discount.usageCount / discount.usageLimit) * 100}%`
                : '0%',
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
        {onEdit && (
          <Button variant="outline" onClick={() => onEdit(discount.discountId)}>
            <Icon icon="pen-to-square" />
            編輯
          </Button>
        )}
        {onToggleStatus && (
          <Button
            variant="outline"
            onClick={() => onToggleStatus(discount.discountId, discount.isActive)}
          >
            <Icon icon={discount.isActive ? 'toggle-on' : 'toggle-off'} />
            {discount.isActive ? '停用' : '啟用'}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            onClick={() => onDelete(discount.discountId, discount.name)}
          >
            <Icon icon="trash" />
            刪除
          </Button>
        )}
      </div>
    </div>
  );
}

export default DiscountCard;
