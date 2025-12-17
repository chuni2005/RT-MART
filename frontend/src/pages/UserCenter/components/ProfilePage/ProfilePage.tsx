/**
 * ProfilePage Component - 個人資料管理頁面
 * 包含三個主要區塊:
 * 1. 個人資料編輯 (姓名、Email、電話)
 * 2. 變更密碼
 * 3. 帳號設定 (刪除帳號)
 */

import { useState, useEffect, ChangeEvent, FocusEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
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

interface ProfileFormErrors {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordFormErrors {
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmPassword?: string | null;
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

  // Profile Form State
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [profileErrors, setProfileErrors] = useState<ProfileFormErrors>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>(
    {}
  );
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileAlert, setProfileAlert] = useState<AlertState>({
    type: "",
    message: "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({});
  const [passwordTouched, setPasswordTouched] = useState<
    Record<string, boolean>
  >({});
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<AlertState>({
    type: "",
    message: "",
  });

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

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // ===========================
  // Profile Form Handlers
  // ===========================

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (profileErrors[name as keyof ProfileFormErrors]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleProfileBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setProfileTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    validateProfileField(name, value);
  };

  const validateProfileField = (name: string, value: string): string | null => {
    let error: string | null = null;

    switch (name) {
      case "name":
        error = validateName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        error = validatePhone(value);
        break;
    }

    setProfileErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error;
  };

  const validateAllProfileFields = (): boolean => {
    const newErrors: ProfileFormErrors = {
      name: validateName(profileData.name),
      email: validateEmail(profileData.email),
      phone: validatePhone(profileData.phone),
    };

    setProfileErrors(newErrors);
    setProfileTouched({
      name: true,
      email: true,
      phone: true,
    });

    return !newErrors.name && !newErrors.email && !newErrors.phone;
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAllProfileFields()) {
      return;
    }

    try {
      setIsProfileLoading(true);
      setProfileAlert({ type: "", message: "" });

      // Call API to update profile
      const updatedUser = await updateProfile(profileData);

      // Update AuthContext with new data
      updateUser(updatedUser);

      // Refresh user data from API
      await checkAuth();

      // Show success message
      setProfileAlert({
        type: "success",
        message: "個人資料已更新成功",
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setProfileAlert({ type: "", message: "" });
      }, 3000);
    } catch (error) {
      console.error("Profile update failed:", error);
      setProfileAlert({
        type: "error",
        message: error instanceof Error ? error.message : "更新失敗,請稍後再試",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  // ===========================
  // Password Form Handlers
  // ===========================

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (passwordErrors[name as keyof PasswordFormErrors]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Re-validate confirm password when new password changes
    if (name === "newPassword" && passwordTouched.confirmPassword) {
      const confirmError = validateConfirmPassword(
        value,
        passwordData.confirmPassword
      );
      setPasswordErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handlePasswordBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    validatePasswordField(name, value);
  };

  const validatePasswordField = (
    name: string,
    value: string
  ): string | null => {
    let error: string | null = null;

    switch (name) {
      case "currentPassword":
        error = validatePassword(value); // Basic validation
        break;
      case "newPassword":
        error = validatePasswordStrength(value); // Strong validation
        break;
      case "confirmPassword":
        error = validateConfirmPassword(passwordData.newPassword, value);
        break;
    }

    setPasswordErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error;
  };

  const validateAllPasswordFields = (): boolean => {
    const newErrors: PasswordFormErrors = {
      currentPassword: validatePassword(passwordData.currentPassword),
      newPassword: validatePasswordStrength(passwordData.newPassword),
      confirmPassword: validateConfirmPassword(
        passwordData.newPassword,
        passwordData.confirmPassword
      ),
    };

    setPasswordErrors(newErrors);
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    return (
      !newErrors.currentPassword &&
      !newErrors.newPassword &&
      !newErrors.confirmPassword
    );
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAllPasswordFields()) {
      return;
    }

    try {
      setIsPasswordLoading(true);
      setPasswordAlert({ type: "", message: "" });

      // Call API to update password
      const response = await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        // Clear password form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordTouched({});

        // Show success message
        setPasswordAlert({
          type: "success",
          message: "密碼已更新成功",
        });

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setPasswordAlert({ type: "", message: "" });
        }, 3000);
      }
    } catch (error) {
      console.error("Password update failed:", error);
      setPasswordAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : "密碼更新失敗,請稍後再試",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

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

  const handleDeletePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
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

        <form onSubmit={handleProfileSubmit} className={styles.form}>
          <FormInput
            label="姓名"
            type="text"
            name="name"
            value={profileData.name}
            onChange={handleProfileChange}
            onBlur={handleProfileBlur}
            error={
              profileTouched.name ? profileErrors.name ?? undefined : undefined
            }
            placeholder="請輸入姓名"
            disabled={isProfileLoading}
            required
          />

          <FormInput
            label="Email"
            type="email"
            name="email"
            value={profileData.email}
            onChange={handleProfileChange}
            onBlur={handleProfileBlur}
            error={
              profileTouched.email
                ? profileErrors.email ?? undefined
                : undefined
            }
            placeholder="請輸入您的 Email"
            disabled={isProfileLoading}
            autoComplete="email"
            required
          />

          <FormInput
            label="電話號碼"
            type="tel"
            name="phone"
            value={profileData.phone}
            onChange={handleProfileChange}
            onBlur={handleProfileBlur}
            error={
              profileTouched.phone
                ? profileErrors.phone ?? undefined
                : undefined
            }
            placeholder="0912-345-678"
            disabled={isProfileLoading}
            autoComplete="tel"
            required
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isProfileLoading}
            fullWidth
          >
            {isProfileLoading ? "更新中..." : "儲存變更"}
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

        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <FormInput
            label="目前密碼"
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={
              passwordTouched.currentPassword
                ? passwordErrors.currentPassword ?? undefined
                : undefined
            }
            placeholder="請輸入目前的密碼"
            disabled={isPasswordLoading}
            autoComplete="current-password"
            required
          />

          <FormInput
            label="新密碼"
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={
              passwordTouched.newPassword
                ? passwordErrors.newPassword ?? undefined
                : undefined
            }
            placeholder="請輸入新密碼"
            disabled={isPasswordLoading}
            autoComplete="new-password"
            required
          />

          {/* Helper text under new password field */}
          <div className={styles.helperText}>
            8-20 個字元,須包含英文大小寫和數字
          </div>

          <FormInput
            label="確認新密碼"
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={
              passwordTouched.confirmPassword
                ? passwordErrors.confirmPassword ?? undefined
                : undefined
            }
            placeholder="請再次輸入新密碼"
            disabled={isPasswordLoading}
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isPasswordLoading}
            fullWidth
          >
            {isPasswordLoading ? "更新中..." : "更新密碼"}
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
