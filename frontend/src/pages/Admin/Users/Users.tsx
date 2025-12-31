import { useState, useRef } from 'react';
import Icon from '@/shared/components/Icon';
import Button from '@/shared/components/Button';
import FormInput from '@/shared/components/FormInput';
import Dialog from '@/shared/components/Dialog';
import Alert from '@/shared/components/Alert';
import SearchBar from '@/shared/components/Header/SearchBar';
import adminService from '@/shared/services/adminService.index';
import { AdminUser } from '@/types/admin';
import { AlertType } from '@/types';
import styles from './Users.module.scss';

function Users() {
  const alertRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastSearchKeyword, setLastSearchKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
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
      showAlert({ type: 'warning', message: '請輸入 Email 或 User ID' });
      return;
    }

    setLoading(true);
    setSearched(true);
    setAlert(null);
    try {
      const { users: allUsers } = await adminService.getUsers();
      const filtered = allUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(keyword.toLowerCase()) ||
          user.user_id.toLowerCase().includes(keyword.toLowerCase()) ||
          user.login_id.toLowerCase().includes(keyword.toLowerCase())
      );
      setUsers(filtered);
    } catch (error) {
      console.error('搜尋使用者失敗:', error);
      showAlert({ type: 'error', message: '搜尋使用者失敗' });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    if (!suspendReason.trim()) {
      showAlert({ type: 'warning', message: '請輸入停權原因' });
      return;
    }

    try {
      await adminService.suspendUser(selectedUser.user_id, suspendReason);
      showAlert({ type: 'success', message: '使用者已停權' });
      setShowSuspendDialog(false);
      setSuspendReason('');
      setSelectedUser(null);
      if (lastSearchKeyword) {
        handleSearch(lastSearchKeyword);
      }
    } catch (error) {
      console.error('停權失敗:', error);
      showAlert({ type: 'error', message: '停權失敗' });
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    try {
      await adminService.unsuspendUser(user.user_id);
      showAlert({ type: 'success', message: '已解除停權' });
      if (lastSearchKeyword) {
        handleSearch(lastSearchKeyword);
      }
    } catch (error) {
      console.error('解除停權失敗:', error);
      showAlert({ type: 'error', message: '解除停權失敗' });
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const roleMap: Record<string, string> = {
      buyer: 'buyer',
      seller: 'seller',
      admin: 'admin',
    };
    return roleMap[role] || 'buyer';
  };

  const getRoleLabel = (role: string) => {
    const labelMap: Record<string, string> = {
      buyer: '買家',
      seller: '賣家',
      admin: '管理員',
    };
    return labelMap[role] || role;
  };

  return (
    <div className={styles.users}>
      <h1 className={styles.pageTitle}>使用者管理</h1>

      {/* Search Section */}
      <SearchBar
        type="users"
        placeholder="輸入 Email 或 User ID 進行搜尋"
        onSearch={(keyword) => handleSearch(keyword)}
        formClassName={styles.searchForm}
      />

      {/* Loading State */}
      {loading && <div className={styles.loading}>搜尋中...</div>}

      {/* Empty State - Before Search */}
      {!loading && !searched && (
        <div className={styles.emptyState}>
          <Icon icon="magnifying-glass" />
          <p>請使用上方搜尋欄查找使用者</p>
        </div>
      )}

      {/* Empty State - No Results */}
      {!loading && searched && users.length === 0 && (
        <div className={styles.emptyState}>
          <Icon icon="user-slash" />
          <p>找不到符合條件的使用者</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && users.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>登入 ID</th>
                <th>姓名</th>
                <th>Email</th>
                <th>電話</th>
                <th>角色</th>
                <th>狀態</th>
                <th>註冊日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.login_id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number}</td>
                  <td>
                    <span
                      className={`${styles.roleBadge} ${
                        styles[getRoleBadgeClass(user.role)]
                      }`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.deleted_at ? (
                      <span className={styles.statusSuspended}>已停權</span>
                    ) : (
                      <span className={styles.statusActive}>正常</span>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      {user.deleted_at ? (
                        <Button
                          size="sm"
                          className={styles.btnSuccess}
                          onClick={() => handleUnsuspend(user)}
                        >
                          解除停權
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className={styles.btnDanger}
                          onClick={() => {
                            setSelectedUser(user);
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
          setSelectedUser(null);
        }}
        title="停權使用者"
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
          <p>確定要停權使用者「{selectedUser?.name}」嗎？</p>
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
                setSelectedUser(null);
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

export default Users;
