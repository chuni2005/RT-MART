/**
 * ProfilePage Component - 個人資料管理頁面
 * 包含三個主要區塊:
 * 1. 個人資料編輯 (姓名、Email、電話)
 * 2. 變更密碼
 * 3. 帳號設定 (刪除帳號)
 */

import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { useForm } from "@/shared/hooks/useForm";
import FormInput from "@/shared/components/FormInput";
import Button from "@/shared/components/Button";
import Icon from "@/shared/components/Icon";
import Alert from "@/shared/components/Alert";
import Dialog from "@/shared/components/Dialog";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordStrength,
  validateConfirmPassword,
} from "@/shared/utils/validation";
import {
  updateProfile,
  updatePassword,
  deleteAccount,
} from "@/shared/services/userService";
import type { AlertType } from "@/types";
import styles from "./ProfilePage.module.scss";

// Type Definitions
interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AlertState {
  type: AlertType | "";
  message: string;
}

interface DeleteDialogState {
  isOpen: boolean;
  password: string;
  error: string;
  isDeleting: boolean;
}

interface SuccessDialogState {
  isOpen: boolean;
  countdown: number;
}

function ProfilePage() {
  const { user, updateUser, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [profileAlert, setProfileAlert] = useState<AlertState>({ type: "", message: "" });
  const [passwordAlert, setPasswordAlert] = useState<AlertState>({ type: "", message: "" });

  // Profile Form
  const profileForm = useForm<ProfileFormData>(
    {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
    async (formValues) => {
      setProfileAlert({ type: "", message: "" });

      try {
        const updatedUser = await updateProfile(formValues);
        updateUser(updatedUser);
        await checkAuth();

        setProfileAlert({
          type: "success",
          message: "個人資料已更新成功",
        });

        setTimeout(() => {
          setProfileAlert({ type: "", message: "" });
        }, 3000);
      } catch (error) {
        console.error("Profile update failed:", error);
        setProfileAlert({
          type: "error",
          message: error instanceof Error ? error.message : "更新失敗,請稍後再試",
        });
      }
    },
    {
      name: (value) => validateName(value),
      email: (value) => validateEmail(value),
      phone: (value) => validatePhone(value),
    }
  );

  // Password Form
  const passwordForm = useForm<PasswordFormData>(
    {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    async (formValues) => {
      setPasswordAlert({ type: "", message: "" });

      try {
        const response = await updatePassword({
          currentPassword: formValues.currentPassword,
          newPassword: formValues.newPassword,
        });

        if (response.success) {
          passwordForm.reset();

          setPasswordAlert({
            type: "success",
            message: "密碼已更新成功",
          });

          setTimeout(() => {
            setPasswordAlert({ type: "", message: "" });
          }, 3000);
        }
      } catch (error) {
        console.error("Password update failed:", error);
        setPasswordAlert({
          type: "error",
          message: error instanceof Error ? error.message : "密碼更新失敗,請稍後再試",
        });
      }
    },
    {
      currentPassword: (value) => validatePassword(value),
      newPassword: (value) => validatePasswordStrength(value),
      confirmPassword: (value, allValues) =>
        validateConfirmPassword(allValues.newPassword, value),
    }
  );

  // Sync user data to profile form
  useEffect(() => {
    if (user) {
      profileForm.setValue("name", user.name || "");
      profileForm.setValue("email", user.email || "");
      profileForm.setValue("phone", user.phone || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    password: "",
    error: "",
    isDeleting: false,
  });

  // Success Dialog State (for account deletion)
  const [successDialog, setSuccessDialog] = useState<SuccessDialogState>({
    isOpen: false,
    countdown: 5,
  });

  // ===========================
  // Delete Account Handlers
  // ===========================

  const handleOpenDeleteDialog = () => {
    setDeleteDialog({
      isOpen: true,
      password: "",
      error: "",
      isDeleting: false,
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      password: "",
      error: "",
      isDeleting: false,
    });
  };

  const handleDeletePasswordChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDeleteDialog((prev) => ({
      ...prev,
      password: e.target.value,
      error: "", // Clear error when typing
    }));
  };

  const handleConfirmDelete = async () => {
    // Validate password is entered
    if (!deleteDialog.password.trim()) {
      setDeleteDialog((prev) => ({
        ...prev,
        error: "請輸入密碼以確認刪除",
      }));
      return;
    }

    try {
      setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

      // Call API to delete account
      const response = await deleteAccount(deleteDialog.password);

      if (response.success) {
        // Close delete dialog
        handleCloseDeleteDialog();

        // Open success dialog with countdown
        setSuccessDialog({
          isOpen: true,
          countdown: 5,
        });

        // Start countdown timer
        startSuccessCountdown();
      }
    } catch (error) {
      console.error("Account deletion failed:", error);
      setDeleteDialog((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "刪除失敗,請檢查密碼是否正確",
        isDeleting: false,
      }));
    }
  };

  const startSuccessCountdown = () => {
    const timer = setInterval(async () => {
      let isZero = false;
      setSuccessDialog((prev) => {
        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          isZero = true;
          return prev;
        }

        return {
          ...prev,
          countdown: newCountdown,
        };
      });

      if (isZero) {
        clearInterval(timer);
        // 執行登出並跳轉
        await logout();
        navigate("/");
      }
    }, 1000);
  };

  const handleCloseSuccessDialog = async () => {
    setSuccessDialog({ isOpen: false, countdown: 0 });
    await logout();
    navigate("/");
  };

  // ===========================
  // JSX Render
  // ===========================

  return (
    <div className={styles.profilePage}>
      {/* Section 1: Personal Information */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>個人資料</h2>

        {/* Alert for profile updates */}
        {profileAlert.message && profileAlert.type && (
          <Alert
            type={profileAlert.type as AlertType}
            message={profileAlert.message}
            onClose={() => setProfileAlert({ type: "", message: "" })}
          />
        )}

        <form onSubmit={profileForm.handleSubmit} className={styles.form}>
          <FormInput
            label="姓名"
            type="text"
            name="name"
            value={profileForm.values.name}
            onChange={profileForm.handleChange}
            onBlur={profileForm.handleBlur}
            error={
              profileForm.touched.name ? profileForm.errors.name ?? undefined : undefined
            }
            placeholder="請輸入姓名"
            disabled={profileForm.isSubmitting}
            required
            fieldName="姓名"
          />

          <FormInput
            label="Email"
            type="email"
            name="email"
            value={profileForm.values.email}
            onChange={profileForm.handleChange}
            onBlur={profileForm.handleBlur}
            error={
              profileForm.touched.email
                ? profileForm.errors.email ?? undefined
                : undefined
            }
            placeholder="請輸入您的 Email"
            disabled={profileForm.isSubmitting}
            autoComplete="email"
            required
            fieldName="Email"
          />

          <FormInput
            label="電話號碼"
            type="tel"
            name="phone"
            value={profileForm.values.phone}
            onChange={profileForm.handleChange}
            onBlur={profileForm.handleBlur}
            error={
              profileForm.touched.phone
                ? profileForm.errors.phone ?? undefined
                : undefined
            }
            placeholder="0912-345-678"
            disabled={profileForm.isSubmitting}
            autoComplete="tel"
            required
            fieldName="電話號碼"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={profileForm.isSubmitting}
            fullWidth
          >
            {profileForm.isSubmitting ? "更新中..." : "儲存變更"}
          </Button>
        </form>
      </div>

      {/* Section 2: Change Password */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>變更密碼</h2>

        {/* Alert for password updates */}
        {passwordAlert.message && passwordAlert.type && (
          <Alert
            type={passwordAlert.type as AlertType}
            message={passwordAlert.message}
            onClose={() => setPasswordAlert({ type: "", message: "" })}
          />
        )}

        <form onSubmit={passwordForm.handleSubmit} className={styles.form}>
          <FormInput
            label="目前密碼"
            type="password"
            name="currentPassword"
            value={passwordForm.values.currentPassword}
            onChange={passwordForm.handleChange}
            onBlur={passwordForm.handleBlur}
            error={
              passwordForm.touched.currentPassword
                ? passwordForm.errors.currentPassword ?? undefined
                : undefined
            }
            placeholder="請輸入目前的密碼"
            disabled={passwordForm.isSubmitting}
            autoComplete="current-password"
            required
            fieldName="目前密碼"
          />

          <FormInput
            label="新密碼"
            type="password"
            name="newPassword"
            value={passwordForm.values.newPassword}
            onChange={passwordForm.handleChange}
            onBlur={passwordForm.handleBlur}
            error={
              passwordForm.touched.newPassword
                ? passwordForm.errors.newPassword ?? undefined
                : undefined
            }
            placeholder="請輸入新密碼"
            disabled={passwordForm.isSubmitting}
            autoComplete="new-password"
            required
            fieldName="新密碼"
          />

          {/* Helper text under new password field */}
          <div className={styles.helperText}>
            8-20 個字元,須包含英文大小寫和數字
          </div>

          <FormInput
            label="確認新密碼"
            type="password"
            name="confirmPassword"
            value={passwordForm.values.confirmPassword}
            onChange={passwordForm.handleChange}
            onBlur={passwordForm.handleBlur}
            error={
              passwordForm.touched.confirmPassword
                ? passwordForm.errors.confirmPassword ?? undefined
                : undefined
            }
            placeholder="請再次輸入新密碼"
            disabled={passwordForm.isSubmitting}
            autoComplete="new-password"
            required
            fieldName="確認新密碼"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={passwordForm.isSubmitting}
            fullWidth
          >
            {passwordForm.isSubmitting ? "更新中..." : "更新密碼"}
          </Button>
        </form>
      </div>

      {/* Section 3: Account Settings */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>帳號設定</h2>

        <div className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>刪除帳號</h3>
          <p className={styles.dangerWarning}>
            <Icon icon="triangle-exclamation" />
            <span>刪除帳號後,所有資料將無法恢復</span>
          </p>

          <Button
            variant="outline"
            onClick={handleOpenDeleteDialog}
            className={styles.dangerButton}
          >
            刪除我的帳號
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog with Password Input */}
      <Dialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCloseDeleteDialog}
        title="確認刪除帳號"
        type="custom"
        variant="danger"
        closeOnOverlayClick={!deleteDialog.isDeleting}
        closeOnEsc={!deleteDialog.isDeleting}
      >
        <div className={styles.deleteDialogContent}>
          <p className={styles.deleteMessage}>
            此操作無法復原,您的所有資料將被永久刪除。
          </p>

          <FormInput
            label="請輸入密碼以確認刪除"
            type="password"
            name="deletePassword"
            value={deleteDialog.password}
            onChange={handleDeletePasswordChange}
            error={deleteDialog.error}
            placeholder="請輸入您的密碼"
            disabled={deleteDialog.isDeleting}
            autoComplete="current-password"
            required
            fieldName="密碼"
          />

          <div className={styles.deleteDialogActions}>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={deleteDialog.isDeleting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              disabled={deleteDialog.isDeleting}
              className={styles.deleteConfirmButton}
            >
              {deleteDialog.isDeleting ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Success Dialog with Auto-Redirect */}
      <Dialog
        isOpen={successDialog.isOpen}
        onClose={handleCloseSuccessDialog}
        title="帳號已刪除"
        type="alert"
        variant="info"
        confirmText="立即返回首頁"
        onConfirm={handleCloseSuccessDialog}
        message={`帳號已成功刪除,將在 ${successDialog.countdown} 秒後自動返回首頁`}
        icon="check-circle"
        closeOnOverlayClick={false}
        closeOnEsc={false}
      />
    </div>
  );
}

export default ProfilePage;
