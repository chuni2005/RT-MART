import { useState, useEffect } from 'react';
import Icon from '@/shared/components/Icon';
import Button from '@/shared/components/Button';
import Alert from '@/shared/components/Alert';
import Tab from '@/shared/components/Tab';
import adminService from '@/shared/services/adminService';
import { SellerApplication } from '@/types/admin';
import { AlertType } from '@/types';
import styles from './Sellers.module.scss';

function Sellers() {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  // Tab items
  const tabItems = [
    { key: 'pending', label: '待審核' },
    { key: 'approved', label: '已批准' },
    { key: 'rejected', label: '已拒絕' },
  ];

  // Fetch applications
  const fetchApplications = async (status: 'pending' | 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const data = await adminService.getSellerApplications({ status });
      setApplications(data);
    } catch (error) {
      console.error('獲取賣家申請失敗:', error);
      setAlert({ type: 'error', message: '獲取賣家申請失敗' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications when tab changes
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    await fetchApplications(tab as 'pending' | 'approved' | 'rejected');
  };

  // Initial load
  useEffect(() => {
    fetchApplications('pending');
  }, []);

  const getStatusBadge = (application: SellerApplication) => {
    if (application.rejected_at) {
      return <span className={styles.statusRejected}>已拒絕</span>;
    }
    if (application.verified) {
      return <span className={styles.statusApproved}>已批准</span>;
    }
    return <span className={styles.statusPending}>待審核</span>;
  };

  return (
    <div className={styles.sellers}>
      <h1 className={styles.pageTitle}>賣家審核</h1>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Tabs */}
      <Tab
        items={tabItems}
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="underline"
        className={styles.tabs}
      />

      {/* Loading State */}
      {loading && <div className={styles.loading}>載入中...</div>}

      {/* Empty State */}
      {!loading && applications.length === 0 && (
        <div className={styles.emptyState}>
          <Icon icon="store-slash" />
          <p>目前沒有{activeTab === 'pending' ? '待審核' : activeTab === 'approved' ? '已批准' : '已拒絕'}的賣家申請</p>
        </div>
      )}

      {/* Applications Table */}
      {!loading && applications.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>賣家名稱</th>
                <th>商店名稱</th>
                <th>Email</th>
                <th>銀行帳戶</th>
                <th>申請時間</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.seller_id}>
                  <td>{app.user_name}</td>
                  <td>{app.store_name}</td>
                  <td>{app.email}</td>
                  <td>{app.bank_account_reference}</td>
                  <td>{new Date(app.user_created_at).toLocaleDateString()}</td>
                  <td>{getStatusBadge(app)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Button size="sm" variant="outline">
                        查看詳情
                      </Button>
                      {!app.verified && !app.rejected_at && (
                        <>
                          <Button size="sm" className={styles.btnSuccess}>
                            批准
                          </Button>
                          <Button size="sm" className={styles.btnDanger}>
                            拒絕
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Sellers;
