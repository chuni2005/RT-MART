/**
 * LoginForm Component - 登入表單
 * 功能：Email/Password 登入 + 記住我
 */

import { useNavigate } from 'react-router-dom';
import { useForm } from "@/shared/hooks/useForm";
import FormInput from '@/shared/components/FormInput';
import { validateLoginIdentifier, validatePassword } from '@/shared/utils/validation';
import styles from './LoginForm.module.scss';

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
        label="帳號或 Email"
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
        placeholder="請輸入帳號或 Email"
        disabled={isLoading}
        autoComplete="username"
        required
        fieldName="帳號或 Email"
      />

      <FormInput
        label="密碼"
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder="請輸入您的密碼"
        disabled={isLoading}
        autoComplete="current-password"
        required
        fieldName="密碼"
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
          <span>記住我</span>
        </label>

        <button
          type="button"
          className={styles.forgotPassword}
          onClick={handleForgotPassword}
          disabled={isLoading}
        >
          忘記密碼？
        </button>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? "登入中..." : "登入"}
      </button>
    </form>
  );
};

export default LoginForm;
