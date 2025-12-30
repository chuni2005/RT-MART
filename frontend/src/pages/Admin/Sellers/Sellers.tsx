import { useState, useEffect, useRef } from "react";
import Icon from "@/shared/components/Icon";
import Button from "@/shared/components/Button";
import Alert from "@/shared/components/Alert";
import Tab from "@/shared/components/Tab";
import adminService from "@/shared/services/adminService.index";
import { SellerApplication } from "@/types/admin";
import { AlertType } from "@/types";
import SellerDetailDialog from "./components/SellerDetailDialog";
import ApproveDialog from "./components/ApproveDialog";
import RejectDialog from "./components/RejectDialog";
import styles from "./Sellers.module.scss";

function Sellers() {
  const alertRef = useRef<HTMLDivElement>(null);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [alert, setAlert] = useState<{
    type: AlertType;
    message: string;
  } | null>(null);

  // Custom setAlert with scroll behavior
  const showAlert = (alertData: { type: AlertType; message: string } | null) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  // Dialog states
  const [selectedApplication, setSelectedApplication] =
    useState<SellerApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Tab items
  const tabItems = [
    { key: "pending", label: "待審核" },
    { key: "approved", label: "已批准" },
    { key: "rejected", label: "已拒絕" },
  ];

  // Fetch applications
  const fetchApplications = async (
    status: "pending" | "approved" | "rejected"
  ) => {
    setLoading(true);
    try {
      const data = await adminService.getSellerApplications({ status });
      setApplications(data);
    } catch (error) {
      console.error("獲取賣家申請失敗:", error);
      showAlert({ type: "error", message: "獲取賣家申請失敗" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications when tab changes
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    await fetchApplications(tab as "pending" | "approved" | "rejected");
  };

  // Initial load
  useEffect(() => {
    fetchApplications("pending");
  }, []);

  // Dialog handlers
  const handleViewDetail = (application: SellerApplication) => {
    setSelectedApplication(application);
    setShowDetailDialog(true);
  };

  const handleApproveClick = (application: SellerApplication) => {
    setSelectedApplication(application);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (application: SellerApplication) => {
    setSelectedApplication(application);
    setShowRejectDialog(true);
  };

  const handleApproveFromDetail = () => {
    setShowDetailDialog(false);
    setShowApproveDialog(true);
  };

  const handleRejectFromDetail = () => {
    setShowDetailDialog(false);
    setShowRejectDialog(true);
  };

  // Approve application
  const handleApproveConfirm = async () => {
    if (!selectedApplication) return;

    setActionLoading(true);
    try {
      await adminService.approveSellerApplication(
        selectedApplication.seller_id
      );
      showAlert({ type: "success", message: "賣家申請已批准" });
      setShowApproveDialog(false);
      setSelectedApplication(null);
      await fetchApplications(activeTab as "pending" | "approved" | "rejected");
    } catch (error) {
      console.error("批准賣家申請失敗:", error);
      showAlert({ type: "error", message: "批准賣家申請失敗" });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject application
  const handleRejectConfirm = async (reason: string) => {
    if (!selectedApplication) return;

    setActionLoading(true);
    try {
      await adminService.rejectSellerApplication(
        selectedApplication.seller_id,
        reason
      );
      showAlert({ type: "success", message: "賣家申請已拒絕" });
      setShowRejectDialog(false);
      setSelectedApplication(null);
      await fetchApplications(activeTab as "pending" | "approved" | "rejected");
    } catch (error) {
      console.error("拒絕賣家申請失敗:", error);
      showAlert({ type: "error", message: "拒絕賣家申請失敗" });
    } finally {
      setActionLoading(false);
    }
  };

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
          <p>
            目前沒有
            {activeTab === "pending"
              ? "待審核"
              : activeTab === "approved"
              ? "已批准"
              : "已拒絕"}
            的賣家申請
          </p>
        </div>
      )}

      {/* Applications Table */}
      {!loading && applications.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>賣家名稱</th>
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
                  <td>{app.email}</td>
                  <td>{app.bank_account_reference}</td>
                  <td>{new Date(app.created_at).toLocaleDateString()}</td>
                  <td>{getStatusBadge(app)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(app)}
                      >
                        查看詳情
                      </Button>
                      {!app.verified && !app.rejected_at && (
                        <>
                          <Button
                            size="sm"
                            className={styles.btnSuccess}
                            onClick={() => handleApproveClick(app)}
                          >
                            批准
                          </Button>
                          <Button
                            size="sm"
                            className={styles.btnDanger}
                            onClick={() => handleRejectClick(app)}
                          >
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

      {/* Dialogs */}
      <SellerDetailDialog
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        application={selectedApplication}
        onApprove={handleApproveFromDetail}
        onReject={handleRejectFromDetail}
      />

      <ApproveDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        application={selectedApplication}
        onConfirm={handleApproveConfirm}
        loading={actionLoading}
      />

      <RejectDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        application={selectedApplication}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />
    </div>
  );
}

export default Sellers;
