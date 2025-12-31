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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation()
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
        loginId: (value) => validateUsername(value, t),
        email: (value) => validateEmail(value, t),
        phone: (value) => validatePhone(value, t),
        password: (value) => validatePasswordStrength(value, t),
        confirmPassword: (value, allValues) =>
          validateConfirmPassword(allValues.password, value, t),
        agreeTerms: (value) => (value ? null : t('signUpForm.errors.agreeTerms')),
      }
    );

  return (
    <form className={styles.signUpForm} onSubmit={handleSubmit}>
      <FormInput
        label={t('signUpForm.labels.loginId')}
        type="text"
        name="loginId"
        value={values.loginId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loginId ? errors.loginId ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.loginId')}
        disabled={isLoading}
        autoComplete="username"
        required
        fieldName={t('signUpForm.labels.loginId')}
      />

      <FormInput
        label={t('signUpForm.labels.email')}
        type="email"
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.email')}
        disabled={isLoading}
        autoComplete="email"
        required
        fieldName={t('signUpForm.labels.email')}
      />

      <FormInput
        label={t('signUpForm.labels.phone')}
        type="tel"
        name="phone"
        value={values.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone ? errors.phone ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.phone')}
        disabled={isLoading}
        autoComplete="tel"
        required
        fieldName={t('signUpForm.labels.phone')}
      />

      <FormInput
        label={t('signUpForm.labels.password')}
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.password')}
        disabled={isLoading}
        autoComplete="new-password"
        required
        fieldName={t('signUpForm.labels.password')}
      />

      {values.password && <PasswordStrength password={values.password} />}

      <FormInput
        label={t('signUpForm.labels.confirmPassword')}
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
        placeholder={t('signUpForm.placeholders.confirmPassword')}
        disabled={isLoading}
        autoComplete="new-password"
        required
        fieldName={t('signUpForm.labels.confirmPassword')}
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
            {t('signUpForm.terms.agree')} <a href="#">{t('signUpForm.terms.arg1')}</a> {t('signUpForm.terms.and')} <a href="#">{t('signUpForm.terms.arg2')}</a>
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
        {isLoading ? t('signUpForm.buttons.submitting') : t('signUpForm.buttons.submit')}
      </button>
    </form>
  );
};

export default SignUpForm;
