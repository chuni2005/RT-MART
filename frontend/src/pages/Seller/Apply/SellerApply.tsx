import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { useForm } from "@/shared/hooks/useForm";
import FormInput from "@/shared/components/FormInput";
import Alert from "@/shared/components/Alert";
import sellerService from "@/shared/services/sellerService";
import { validateBankAccount } from "@/shared/utils/validation";
import { AlertType } from "@/types";
import type { SellerApplicationForm } from "@/types/seller";
import styles from "./SellerApply.module.scss";

interface AlertState {
  type: AlertType | "";
  message: string;
}

/**
 * Seller Apply Page - 賣家申請頁面
 * 允許買家填寫申請表單成為賣家
 * 佈局：左側品牌視覺 + 右側表單（參考 Auth.tsx 設計）
 */
function SellerApply() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 權限檢查：只有 buyer 可以申請
  if (!user || user.role !== "buyer") {
    navigate("/");
    return null;
  }

  const [alert, setAlert] = useState<AlertState>({ type: "", message: "" });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } =
    useForm<SellerApplicationForm>(
      {
        bank_account_reference: "",
      },
      async (formValues) => {
        setAlert({ type: "", message: "" });

        try {
          const response = await sellerService.applyToBeSeller(formValues);

          if (response.success) {
            setAlert({
              type: "success",
              message: response.message,
            });

            setTimeout(() => {
              navigate("/");
            }, 2000);
          } else {
            setAlert({
              type: "error",
              message: "申請提交失敗，請稍後再試",
            });
          }
        } catch (error: any) {
          setAlert({
            type: "error",
            message: error?.message || "申請提交失敗，請檢查網路連接後重試",
          });
        }
      },
      {
        bank_account_reference: (value) => validateBankAccount(value),
      }
    );

  return (
    <div className={styles.sellerApply}>
      {/* 左側面板 - 品牌視覺 */}
      <div className={styles.leftPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>RT-MART</span>
          </div>
          <h1 className={styles.slogan}>歡迎加入 RT-MART</h1>
          <p className={styles.description}>
            成為我們最忠實的夥伴，開啟您的線上銷售之旅
          </p>
        </div>
      </div>

      {/* 右側面板 - 表單 */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>賣家申請表單</h2>
            <p className={styles.formSubtitle}>
              填寫以下資訊即可申請成為賣家，我們將在 1-3 個工作天內完成審核
            </p>
          </div>

          {/* Alert */}
          {alert.message && alert.type && (
            <Alert
              type={alert.type as AlertType}
              message={alert.message}
              onClose={() => setAlert({ type: "", message: "" })}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* 金流資訊 */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>金流資訊</h3>
              <FormInput
                name="bank_account_reference"
                label="銀行帳戶"
                type="text"
                value={values.bank_account_reference}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="請輸入銀行帳戶參考號"
                required
                fieldName="銀行帳戶"
                error={
                  touched.bank_account_reference
                    ? errors.bank_account_reference
                    : undefined
                }
                disabled={isSubmitting}
              />
              <p className={styles.hint}>
                銀行帳戶資訊用於收款。商店名稱將在審核通過後自動生成為「您的姓名's
                Store」。
              </p>
            </div>

            {/* 提交按鈕 */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => navigate("/")}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "提交中..." : "提交申請"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SellerApply;
