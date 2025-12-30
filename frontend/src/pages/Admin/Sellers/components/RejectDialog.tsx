import { useState } from 'react';
import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import { SellerApplication } from '@/types/admin';
import styles from './RejectDialog.module.scss';

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplication | null;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const COMMON_REASONS = [
  '資料不完整',
  '銀行帳戶資訊有誤',
  '疑似重複申請',
];

function RejectDialog({
  isOpen,
  onClose,
  application,
  onConfirm,
  loading = false,
}: RejectDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleClose = () => {
    setRejectionReason('');
    onClose();
  };

  const handleConfirm = () => {
    if (rejectionReason.trim().length >= 10) {
      onConfirm(rejectionReason);
      setRejectionReason('');
    }
  };

  const handleQuickSelect = (reason: string) => {
    setRejectionReason(reason);
  };

  if (!application) return null;

  const charCount = rejectionReason.length;
  const isValid = charCount >= 10 && charCount <= 200;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="拒絕申請" type="custom">
      <div className={styles.dialogContent}>
        {/* 申請者資訊 */}
        <div className={styles.applicantInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>申請者姓名：</span>
            <span className={styles.value}>{application.user_name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email：</span>
            <span className={styles.value}>{application.email}</span>
          </div>
        </div>

        {/* 常見原因快選按鈕 */}
        <div className={styles.quickReasons}>
          <label className={styles.quickReasonsLabel}>常見拒絕原因：</label>
          <div className={styles.quickReasonButtons}>
            {COMMON_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className={styles.quickReasonBtn}
                onClick={() => handleQuickSelect(reason)}
                disabled={loading}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        {/* 拒絕原因輸入框 */}
        <div className={styles.reasonInput}>
          <label htmlFor="rejection-reason">
            拒絕原因 <span className={styles.required}>*</span>
          </label>
          <textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="請輸入拒絕原因（10-200 字）"
            rows={5}
            maxLength={200}
            disabled={loading}
            className={charCount > 0 && !isValid ? styles.invalid : ''}
          />
          <div className={styles.charCount}>
            <span className={charCount < 10 || charCount > 200 ? styles.error : ''}>
              {charCount} / 200 字
            </span>
            {charCount > 0 && charCount < 10 && (
              <span className={styles.hint}>至少需要 10 字</span>
            )}
          </div>
        </div>

        {/* 警告提示 */}
        <div className={styles.warning}>
          <strong>注意：</strong>拒絕原因將發送給申請者，請謹慎填寫。
        </div>

        {/* 操作按鈕 */}
        <div className={styles.actions}>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button
            className={styles.btnDanger}
            onClick={handleConfirm}
            disabled={!isValid || loading}
          >
            {loading ? '處理中...' : '確認拒絕'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default RejectDialog;
