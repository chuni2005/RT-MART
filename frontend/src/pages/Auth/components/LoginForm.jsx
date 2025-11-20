/**
 * LoginForm Component - 登入表單
 * 功能：Email/Password 登入 + 記住我
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../../shared/components/FormInput';
import { validateLoginIdentifier, validatePassword } from '../../../shared/utils/validation';
import styles from './LoginForm.module.scss';

const LoginForm = ({ onSubmit, isLoading }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginIdentifier: '', // 可以是 email 或 username
    password: '',
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 處理輸入變更
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // 清除該欄位的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // 處理欄位失焦
  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // 驗證該欄位
    validateField(name, value);
  };

  // 驗證單一欄位
  const validateField = (name, value) => {
    let error = null;

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

  // 驗證所有欄位
  const validateAll = () => {
    const newErrors = {
      loginIdentifier: validateLoginIdentifier(formData.loginIdentifier),
      password: validatePassword(formData.password),
    };

    setErrors(newErrors);
    setTouched({ loginIdentifier: true, password: true });

    return !newErrors.loginIdentifier && !newErrors.password;
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證
    if (!validateAll()) {
      return;
    }

    // 執行登入
    try {
      await onSubmit(formData);
    } catch (error) {
      // 錯誤由父組件處理
      console.error('Login form error:', error);
    }
  };

  // 處理忘記密碼
  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      {/* 帳號或 Email 輸入 */}
      <FormInput
        label="帳號或 Email" // TODO: i18n
        type="text"
        name="loginIdentifier"
        value={formData.loginIdentifier}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loginIdentifier ? errors.loginIdentifier : null}
        placeholder="請輸入帳號或 Email" // TODO: i18n
        disabled={isLoading}
        autoComplete="username"
        required
      />

      {/* 密碼輸入 */}
      <FormInput
        label="密碼" // TODO: i18n
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password : null}
        placeholder="請輸入您的密碼" // TODO: i18n
        disabled={isLoading}
        autoComplete="current-password"
        required
      />

      {/* 記住我 + 忘記密碼 */}
      <div className={styles.formOptions}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>記住我</span> {/* TODO: i18n */}
        </label>

        <button
          type="button"
          className={styles.forgotPassword}
          onClick={handleForgotPassword}
          disabled={isLoading}
        >
          忘記密碼？ {/* TODO: i18n */}
        </button>
      </div>

      {/* 登入按鈕 */}
      <button type="submit" className={styles.submitButton} disabled={isLoading}>
        {isLoading ? '登入中...' : '登入'} {/* TODO: i18n */}
      </button>
    </form>
  );
};

export default LoginForm;
