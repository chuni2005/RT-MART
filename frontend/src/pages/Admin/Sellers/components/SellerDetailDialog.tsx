import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import { SellerApplication } from '@/types/admin';
import styles from './SellerDetailDialog.module.scss';

interface SellerDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplication | null;
  onApprove?: () => void;
  onReject?: () => void;
}

function SellerDetailDialog({
  isOpen,
  onClose,
  application,
  onApprove,
  onReject,
}: SellerDetailDialogProps) {
  if (!application) return null;

  const isPending = !application.verified && !application.rejected_at;
  const isApproved = application.verified;
  const isRejected = !!application.rejected_at;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="賣家申請詳情"
      type="custom"
      size="large"
    >
      <div className={styles.dialogContent}>
        {/* Section 1: 賣家資訊 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>賣家資訊</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>使用者帳號</label>
              <p>{application.login_id}</p>
            </div>
            <div className={styles.infoItem}>
              <label>賣家姓名</label>
              <p>{application.user_name}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Email</label>
              <p>{application.email}</p>
            </div>
            <div className={styles.infoItem}>
              <label>電話</label>
              <p>{application.phone_number}</p>
            </div>
            <div className={styles.infoItem}>
              <label>申請時間</label>
              <p>{new Date(application.user_created_at).toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Section 2: 商店資訊 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>商店資訊</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>商店名稱</label>
              <p>{application.store_name}</p>
            </div>
            <div className={styles.infoItem}>
              <label>商店描述</label>
              <p>{application.store_description}</p>
            </div>
            <div className={styles.infoItem}>
              <label>商店地址</label>
              <p>{application.store_address}</p>
            </div>
            <div className={styles.infoItem}>
              <label>商店電話</label>
              <p>{application.store_phone}</p>
            </div>
            <div className={styles.infoItem}>
              <label>商店 Email</label>
              <p>{application.store_email}</p>
            </div>
          </div>
        </section>

        {/* Section 3: 金流資訊 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>金流資訊</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>銀行帳戶</label>
              <p>{application.bank_account_reference}</p>
            </div>
          </div>
        </section>

        {/* Section 4: 審核狀態 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>審核狀態</h3>
          <div className={styles.statusInfo}>
            {isPending && <span className={styles.statusPending}>待審核</span>}
            {isApproved && (
              <>
                <span className={styles.statusApproved}>已批准</span>
                {application.verified_at && (
                  <div className={styles.statusDetails}>
                    <p>
                      <strong>審核時間：</strong>
                      {new Date(application.verified_at).toLocaleString()}
                    </p>
                    {application.verified_by && (
                      <p>
                        <strong>審核者：</strong>
                        {application.verified_by}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {isRejected && (
              <>
                <span className={styles.statusRejected}>已拒絕</span>
                {application.rejected_at && (
                  <div className={styles.statusDetails}>
                    <p>
                      <strong>拒絕時間：</strong>
                      {new Date(application.rejected_at).toLocaleString()}
                    </p>
                    {application.rejection_reason && (
                      <p>
                        <strong>拒絕原因：</strong>
                        {application.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
          {isPending && onReject && (
            <Button className={styles.btnDanger} onClick={onReject}>
              拒絕
            </Button>
          )}
          {isPending && onApprove && (
            <Button className={styles.btnSuccess} onClick={onApprove}>
              批准
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default SellerDetailDialog;
