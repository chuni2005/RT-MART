import { useState, useRef } from 'react';
import Icon from '@/shared/components/Icon';
import Button from '@/shared/components/Button';
import FormInput from '@/shared/components/FormInput';
import Dialog from '@/shared/components/Dialog';
import Alert from '@/shared/components/Alert';
import SearchBar from '@/shared/components/Header/SearchBar';
import adminService from '@/shared/services/adminService.index';
import { AdminStore } from '@/types/admin';
import { AlertType } from '@/types';
import styles from './Stores.module.scss';

function Stores() {
  const alertRef = useRef<HTMLDivElement>(null);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastSearchKeyword, setLastSearchKeyword] = useState('');
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  // Custom setAlert with scroll behavior
  const showAlert = (alertData: { type: AlertType; message: string } | null) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleSearch = async (keyword: string) => {
    setLastSearchKeyword(keyword);
    if (!keyword.trim()) {
      showAlert({ type: 'warning', message: '請輸入商家名稱或 Store ID' });
      return;
    }

    setLoading(true);
    setSearched(true);
    setAlert(null);
    try {
      // Let backend do the filtering instead of fetching all stores
      const { stores } = await adminService.getStores({
        search: keyword,
        includeSuspended: true, // Include suspended stores in search
      });
      setStores(stores);
    } catch (error) {
      console.error('搜尋商家失敗:', error);
      showAlert({ type: 'error', message: '搜尋商家失敗' });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedStore) return;
    if (!suspendReason.trim()) {
      showAlert({ type: 'warning', message: '請輸入停權原因' });
      return;
    }

    try {
      await adminService.suspendStore(selectedStore.store_id, suspendReason);
      showAlert({ type: 'success', message: '商家已停權' });
      setShowSuspendDialog(false);
      setSuspendReason('');
      setSelectedStore(null);
      if (lastSearchKeyword) {
        handleSearch(lastSearchKeyword);
      }
    } catch (error) {
      console.error('停權失敗:', error);
      showAlert({ type: 'error', message: '停權失敗' });
    }
  };

  const handleUnsuspend = async (store: AdminStore) => {
    try {
      await adminService.unsuspendStore(store.store_id);
      showAlert({ type: 'success', message: '已解除停權' });
      if (lastSearchKeyword) {
        handleSearch(lastSearchKeyword);
      }
    } catch (error) {
      console.error('解除停權失敗:', error);
      showAlert({ type: 'error', message: '解除停權失敗' });
    }
  };

  return (
    <div className={styles.stores}>
      <h1 className={styles.pageTitle}>商家管理</h1>

      {/* Search Section */}
      <SearchBar
        type="stores"
        placeholder="輸入商家名稱或 Store ID 進行搜尋"
        onSearch={(keyword) => handleSearch(keyword)}
        formClassName={styles.searchForm}
      />

      {/* Loading State */}
      {loading && <div className={styles.loading}>搜尋中...</div>}

      {/* Empty State - Before Search */}
      {!loading && !searched && (
        <div className={styles.emptyState}>
          <Icon icon="magnifying-glass" />
          <p>請使用上方搜尋欄查找商家</p>
        </div>
      )}

      {/* Empty State - No Results */}
      {!loading && searched && stores.length === 0 && (
        <div className={styles.emptyState}>
          <Icon icon="store-slash" />
          <p>找不到符合條件的商家</p>
        </div>
      )}

      {/* Stores Table */}
      {!loading && stores.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Store ID</th>
                <th>商家名稱</th>
                <th>賣家姓名</th>
                <th>賣家 Email</th>
                <th>電話</th>
                <th>商品數</th>
                <th>評分</th>
                <th>狀態</th>
                <th>註冊日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.store_id}>
                  <td>{store.store_id}</td>
                  <td>{store.store_name}</td>
                  <td>{store.seller_name}</td>
                  <td>{store.seller_email}</td>
                  <td>{store.phone}</td>
                  <td>{store.product_count}</td>
                  <td>
                    <div className={styles.rating}>
                      <Icon icon="star" className={styles.starIcon} />
                      <span>
                        {typeof store.rating === 'number' ? store.rating.toFixed(1) : '0.0'} ({store.total_ratings})
                      </span>
                    </div>
                  </td>
                  <td>
                    {store.deleted_at ? (
                      <span className={styles.statusSuspended}>已停權</span>
                    ) : (
                      <span className={styles.statusActive}>正常</span>
                    )}
                  </td>
                  <td>{new Date(store.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      {store.deleted_at ? (
                        <Button
                          size="sm"
                          className={styles.btnSuccess}
                          onClick={() => handleUnsuspend(store)}
                        >
                          解除停權
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className={styles.btnDanger}
                          onClick={() => {
                            setSelectedStore(store);
                            setShowSuspendDialog(true);
                          }}
                        >
                          停權
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suspend Dialog */}
      <Dialog
        isOpen={showSuspendDialog}
        onClose={() => {
          setShowSuspendDialog(false);
          setSuspendReason("");
          setSelectedStore(null);
        }}
        title="停權商家"
        type="custom"
      >
        <div className={styles.dialogContent}>
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
          <p>確定要停權商家「{selectedStore?.store_name}」嗎？</p>
          <FormInput
            name="suspendReason"
            type="text"
            placeholder="請輸入停權原因"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className={styles.dialogActions}>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspendReason("");
                setSelectedStore(null);
              }}
            >
              取消
            </Button>
            <Button className={styles.btnDanger} onClick={handleSuspend}>
              確認停權
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Stores;
