/**
 * SignUpForm Component - 註冊表單
 * 功能：用戶名 + Email + 電話 + Password + 確認密碼 + 密碼強度檢查
 * 注意：註冊時 name = loginId，後續可透過個人設定更改 name
 */
import FormInput from "@/shared/components/FormInput";
import PasswordStrength from "./PasswordStrength";
import { useForm } from "@/shared/hooks/useForm";
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateConfirmPassword,
} from "@/shared/utils/validation";
import styles from "./SignUpForm.module.scss";

interface SignUpFormProps {
  onSubmit: (formData: SignUpFormData) => Promise<void>;
  isLoading: boolean;
}

interface SignUpFormData {
  loginId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface FormData {
  loginId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const SignUpForm = ({ onSubmit, isLoading }: SignUpFormProps) => {
  // 使用 useForm hook 替換所有手動狀態管理
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useForm<FormData>(
      {
        loginId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
      },
      async (formValues) => {
        // 提交邏輯
        await onSubmit({
          loginId: formValues.loginId,
          name: formValues.loginId,
          email: formValues.email,
          phone: formValues.phone,
          password: formValues.password,
        });
      },
      {
        // 驗證規則
        loginId: (value) => validateUsername(value),
        email: (value) => validateEmail(value),
        phone: (value) => validatePhone(value),
        password: (value) => validatePasswordStrength(value),
        confirmPassword: (value, allValues) =>
          validateConfirmPassword(allValues.password, value),
        agreeTerms: (value) => (value ? null : "請同意服務條款與隱私政策"),
      }
    );

  return (
    <form className={styles.signUpForm} onSubmit={handleSubmit}>
      <FormInput
        label="用戶名"
        type="text"
        name="loginId"
        value={values.loginId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loginId ? errors.loginId ?? undefined : undefined}
        placeholder="4-20 個英數字或符號(_ - .)"
        disabled={isLoading}
        autoComplete="username"
        required
        fieldName="用戶名"
      />

      <FormInput
        label="Email"
        type="email"
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email ?? undefined : undefined}
        placeholder="請輸入您的 Email"
        disabled={isLoading}
        autoComplete="email"
        required
        fieldName="Email"
      />

      <FormInput
        label="電話號碼"
        type="tel"
        name="phone"
        value={values.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone ? errors.phone ?? undefined : undefined}
        placeholder="0912-345-678"
        disabled={isLoading}
        autoComplete="tel"
        required
        fieldName="電話號碼"
      />

      <FormInput
        label="密碼"
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder="請輸入密碼（至少 8 碼，含大小寫及數字）"
        disabled={isLoading}
        autoComplete="new-password"
        required
        fieldName="密碼"
      />

      {values.password && <PasswordStrength password={values.password} />}

      <FormInput
        label="確認密碼"
        type="password"
        name="confirmPassword"
        value={values.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          touched.confirmPassword
            ? errors.confirmPassword ?? undefined
            : undefined
        }
        placeholder="請再次輸入密碼"
        disabled={isLoading}
        autoComplete="new-password"
        required
        fieldName="確認密碼"
      />

      <div className={styles.termsContainer}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="agreeTerms"
            checked={values.agreeTerms}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>
            我同意 <a href="#">服務條款</a> 與 <a href="#">隱私政策</a>
          </span>
        </label>
        {touched.agreeTerms && errors.agreeTerms && (
          <div className={styles.error}>{errors.agreeTerms}</div>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? "註冊中..." : "註冊"}
      </button>
    </form>
  );
};

export default SignUpForm;
