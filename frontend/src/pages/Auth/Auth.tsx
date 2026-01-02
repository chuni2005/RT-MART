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

interface AlertState {
  type: AlertType | "";
  message: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const { login, registerWithVerification, isLoading: authLoading } = useAuth();

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
      setAlert({ type: "success", message: "登入成功！即將跳轉..." }); // TODO: i18n

      // 延遲跳轉
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Login failed:", error);
      setAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : "登入失敗，請稍後再試",
      }); // TODO: i18n
    } finally {
      setIsLoading(false);
    }
  };

  // 處理發送驗證碼（Step 1）
  const handleSendCode = async (formData: any) => {
    setIsLoading(true);
    setAlert({ type: "", message: "" });

    try {
      await registerWithVerification.sendCode(
        formData.loginId,
        formData.name,
        formData.email,
        formData.phone,
        formData.password
      );
      // 成功後表單會自動切換到 Step 2
    } catch (error) {
      console.error("Send code failed:", error);
      throw error; // 讓 SignUpForm 處理錯誤
    } finally {
      setIsLoading(false);
    }
  };

  // 處理驗證碼驗證（Step 2）
  const handleVerifyCode = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setAlert({ type: "", message: "" });

      await registerWithVerification.verifyCode(email, code);

      // 註冊成功（自動登入）
      setAlert({ type: "success", message: "註冊成功！即將跳轉..." });

      // 延遲跳轉
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Verify code failed:", error);
      throw error; // 讓 SignUpForm 處理錯誤
    } finally {
      setIsLoading(false);
    }
  };

  // 處理重新發送驗證碼
  const handleResendCode = async (email: string) => {
    setIsLoading(true);
    try {
      await registerWithVerification.resendCode(email);
    } catch (error) {
      console.error("Resend code failed:", error);
      throw error;
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
          <h1 className={styles.slogan}>您的線上購物首選平台</h1>
          {/* TODO: i18n */}
          <p className={styles.description}>
            探索數萬種商品，享受便捷的購物體驗 {/* TODO: i18n */}
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
              登入 {/* TODO: i18n */}
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "signup" ? styles.active : ""
              }`}
              onClick={() => handleTabChange("signup")}
              disabled={loading}
            >
              註冊 {/* TODO: i18n */}
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
              <SignUpForm
                onSendCode={handleSendCode}
                onVerifyCode={handleVerifyCode}
                onResendCode={handleResendCode}
                isLoading={loading}
              />
            )}
          </div>

          {/* 底部連結 */}
          <div className={styles.footer}>
            {activeTab === "login" ? (
              <p>
                還沒有帳號？
                <button
                  className={styles.linkButton}
                  onClick={() => handleTabChange("signup")}
                  disabled={loading}
                >
                  立即註冊
                </button>
                {/* TODO: i18n */}
              </p>
            ) : (
              <p>
                已經有帳號了？
                <button
                  className={styles.linkButton}
                  onClick={() => handleTabChange("login")}
                  disabled={loading}
                >
                  立即登入
                </button>
                {/* TODO: i18n */}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
