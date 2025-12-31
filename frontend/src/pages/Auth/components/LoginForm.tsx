/**
 * LoginForm Component - 登入表單
 * 功能：Email/Password 登入 + {t('login.rememberMe')}
 */

import { useNavigate } from 'react-router-dom';
import { useForm } from "@/shared/hooks/useForm";
import FormInput from '@/shared/components/FormInput';
import { validateLoginIdentifier, validatePassword } from '@/shared/utils/validation';
import styles from './LoginForm.module.scss';
import { useTranslation } from 'react-i18next';

interface LoginFormProps {
  onSubmit: (formData: LoginFormData) => Promise<void>;
  isLoading: boolean;
}

interface LoginFormData {
  loginIdentifier: string;
  password: string;
  remember: boolean;
}

const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useForm<LoginFormData>(
      {
        loginIdentifier: "",
        password: "",
        remember: false,
      },
      async (formValues) => {
        await onSubmit(formValues);
      },
      {
        loginIdentifier: (value) => validateLoginIdentifier(value),
        password: (value) => validatePassword(value),
      }
    );

  const handleForgotPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigate("/forgot-password");
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <FormInput
        label={t('login.identifier')}
        type="text"
        name="loginIdentifier"
        value={values.loginIdentifier}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          touched.loginIdentifier
            ? errors.loginIdentifier ?? undefined
            : undefined
        }
        placeholder={t('login.identifierPlaceholder')}
        disabled={isLoading}
        autoComplete="username"
        required
        fieldName={t('login.identifier')}
      />

      <FormInput
        label={t('login.password')}
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder={t('login.passwordPlaceholder')}
        disabled={isLoading}
        autoComplete="current-password"
        required
        fieldName={t('login.password')}
      />

      <div className={styles.formOptions}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="remember"
            checked={values.remember}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>{t('login.rememberMe')}</span>
        </label>

        <button
          type="button"
          className={styles.forgotPassword}
          onClick={handleForgotPassword}
          disabled={isLoading}
        >
          {t('login.forgotPassword')}
        </button>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? t('login.loading') : t('login.submit')}
      </button>
    </form>
  );
};

export default LoginForm;
