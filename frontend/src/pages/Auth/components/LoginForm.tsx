/**
 * LoginForm Component - 登入表單
 * 功能：Email/Password 登入 + 記住我
 */

import { useState, ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface FormErrors {
  loginIdentifier?: string | null;
  password?: string | null;
}

interface TouchedFields {
  loginIdentifier?: boolean;
  password?: boolean;
}

const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    loginIdentifier: '',
    password: '',
    remember: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    validateField(name, value);
  };

  const validateField = (name: string, value: string): string | null => {
    let error: string | null = null;

    switch (name) {
      case 'loginIdentifier':
        error = validateLoginIdentifier(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));

    return error;
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      loginIdentifier: validateLoginIdentifier(formData.loginIdentifier),
      password: validatePassword(formData.password),
    };

    setErrors(newErrors);
    setTouched({ loginIdentifier: true, password: true });

    return !newErrors.loginIdentifier && !newErrors.password;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Login form error:', error);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <FormInput
        label="帳號或 Email"
        type="text"
        name="loginIdentifier"
        value={formData.loginIdentifier}
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
      />

      <FormInput
        label="密碼"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder="請輸入您的密碼"
        disabled={isLoading}
        autoComplete="current-password"
        required
      />

      <div className={styles.formOptions}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember}
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
