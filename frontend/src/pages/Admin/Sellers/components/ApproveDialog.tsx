import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import { SellerApplication } from '@/types/admin';
import styles from './ApproveDialog.module.scss';

interface ApproveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplication | null;
  onConfirm: () => void;
  loading?: boolean;
}

function ApproveDialog({
  isOpen,
  onClose,
  application,
  onConfirm,
  loading = false,
}: ApproveDialogProps) {
  if (!application) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="確認批准" type="custom">
      <div className={styles.dialogContent}>
        <p className={styles.message}>
          確定要批准 <strong>{application.user_name}</strong> 的賣家申請嗎？
        </p>

        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email：</span>
            <span className={styles.value}>{application.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>銀行帳戶：</span>
            <span className={styles.value}>{application.bank_account_reference}</span>
          </div>
        </div>

        <p className={styles.hint}>批准後該使用者將成為平台賣家，可以開始銷售商品。</p>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button className={styles.btnSuccess} onClick={onConfirm} disabled={loading}>
            {loading ? '處理中...' : '確認批准'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default ApproveDialog;
