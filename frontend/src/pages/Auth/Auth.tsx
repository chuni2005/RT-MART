/**
 * Auth Page - 認證頁面（登入/註冊）
 * 佈局：左側品牌視覺 + 右側表單（Tab 切換）
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";
import Alert from "@/shared/components/Alert";
import styles from "./Auth.module.scss";
import { AlertType } from "@/types";
import { useTranslation } from 'react-i18next';

interface AlertState {
  type: AlertType | "";
  message: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const { login, register, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ type: "", message: "" });

  // 切換 Tab
  const handleTabChange = (tab: "login" | "signup") => {
    if (isLoading) return; // 載入中不允許切換
    setActiveTab(tab);
    setAlert({ type: "", message: "" }); // 清除訊息
  };

  // 處理登入
  const handleLogin = async (formData: any) => {
    try {
      setIsLoading(true);
      setAlert({ type: "", message: "" });

      await login(
        formData.loginIdentifier,
        formData.password,
        formData.remember
      );

      // 登入成功
      setAlert({ type: "success", message: t('auth.alerts.loginSuccess')});

      // 延遲跳轉
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Login failed:", error);
      setAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : t('auth.alerts.loginError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 處理註冊
  const handleRegister = async (formData: any) => {
    try {
      setIsLoading(true);
      setAlert({ type: "", message: "" });

      // 註冊時 formData.name = formData.loginId，後續可透過個人設定更改
      await register(
        formData.loginId,
        formData.name,
        formData.email,
        formData.phone,
        formData.password
      );

      // 註冊成功（自動登入）
      setAlert({ type: "success", message: t('auth.alerts.signupSuccess')});

      // 延遲跳轉
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Register failed:", error);
      setAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : t('auth.alerts.signupError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || authLoading;

  return (
    <div className={styles.authPage}>
      {/* 左側面板 - 品牌視覺 */}
      <div className={styles.leftPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>RT-MART</span>
          </div>
          <h1 className={styles.slogan}>{t('auth.brand.slogan')}</h1>
          <p className={styles.description}>
            {t('auth.brand.description')}
          </p>
        </div>
      </div>

      {/* 右側面板 - 表單 */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          {/* Tab 切換 */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "login" ? styles.active : ""
              }`}
              onClick={() => handleTabChange("login")}
              disabled={loading}
            >
              {t('auth.tabs.login')}
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "signup" ? styles.active : ""
              }`}
              onClick={() => handleTabChange("signup")}
              disabled={loading}
            >
              {t('auth.tabs.signup')}
            </button>
          </div>

          {/* 訊息提示 */}
          {alert.message && alert.type && (
            <Alert
              type={alert.type as AlertType}
              message={alert.message}
              onClose={() => setAlert({ type: "", message: "" })} // 清空後，alert 消失(if (!message) return null;)
            />
          )}

          {/* 表單內容 */}
          <div className={styles.formContent}>
            {activeTab === "login" ? (
              <LoginForm onSubmit={handleLogin} isLoading={loading} />
            ) : (
              <SignUpForm onSubmit={handleRegister} isLoading={loading} />
            )}
          </div>

          {/* 底部連結 */}
          <div className={styles.footer}>
            {activeTab === "login" ? (
              <p>
                {t('auth.footer.noAccount')}
                <button
                  className={styles.linkButton}
                  onClick={() => handleTabChange("signup")}
                  disabled={loading}
                >
                  {t('auth.footer.signupNow')}
                </button>
              </p>
            ) : (
              <p>
                {t('auth.footer.hasAccount')}
                <button
                  className={styles.linkButton}
                  onClick={() => handleTabChange("login")}
                  disabled={loading}
                >
                  {t('auth.footer.loginNow')}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
