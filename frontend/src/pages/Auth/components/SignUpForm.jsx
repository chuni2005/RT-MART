/**
 * SignUpForm Component - 註冊表單
 * 功能：用戶名 + Email + 電話 + Password + 確認密碼 + 密碼強度檢查
 * 注意：註冊時 name = loginId，後續可透過個人設定更改 name
 */

import { useState } from 'react';
import FormInput from '../../../shared/components/FormInput';
import PasswordStrength from './PasswordStrength';
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateConfirmPassword,
} from '../../../shared/utils/validation';
import styles from './SignUpForm.module.scss';

const SignUpForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
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

    // 如果是密碼欄位，也要重新驗證確認密碼
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateConfirmPassword(value, formData.confirmPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError,
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
      case 'loginId':
        error = validateUsername(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'password':
        error = validatePasswordStrength(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.password, value);
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
      loginId: validateUsername(formData.loginId),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePasswordStrength(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
    };

    // 檢查是否同意條款
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '請同意服務條款與隱私政策'; // TODO: i18n
    }

    setErrors(newErrors);
    setTouched({ loginId: true, email: true, phone: true, password: true, confirmPassword: true, agreeTerms: true });

    return !newErrors.loginId && !newErrors.email && !newErrors.phone && !newErrors.password && !newErrors.confirmPassword && !newErrors.agreeTerms;
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證
    if (!validateAll()) {
      return;
    }

    // 執行註冊
    try {
      await onSubmit({
        loginId: formData.loginId,
        name: formData.loginId, // 註冊時 name = loginId
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    } catch (error) {
      // 錯誤由父組件處理
      console.error('SignUp form error:', error);
    }
  };

  return (
    <form className={styles.signUpForm} onSubmit={handleSubmit}>
      {/* 帳號輸入 (login_id) */}
      <FormInput
        label="用戶名" // TODO: i18n
        type="text"
        name="loginId"
        value={formData.loginId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loginId ? errors.loginId : null}
        placeholder="4-20 個英數字" // TODO: i18n
        disabled={isLoading}
        autoComplete="username"
        required
      />

      {/* Email 輸入 */}
      <FormInput
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email : null}
        placeholder="請輸入您的 Email" // TODO: i18n
        disabled={isLoading}
        autoComplete="email"
        required
      />

      {/* 電話輸入 */}
      <FormInput
        label="電話號碼" // TODO: i18n
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone ? errors.phone : null}
        placeholder="0912-345-678" // TODO: i18n
        disabled={isLoading}
        autoComplete="tel"
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
        placeholder="請輸入密碼（至少 8 碼，含大小寫及數字）" // TODO: i18n
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      {/* 密碼強度指示器 */}
      {formData.password && <PasswordStrength password={formData.password} />}

      {/* 確認密碼輸入 */}
      <FormInput
        label="確認密碼" // TODO: i18n
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.confirmPassword ? errors.confirmPassword : null}
        placeholder="請再次輸入密碼" // TODO: i18n
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      {/* 同意條款 */}
      <div className={styles.termsContainer}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>
            我同意 <a href="#">服務條款</a> 與 <a href="#">隱私政策</a> {/* TODO: i18n */}
          </span>
        </label>
        {touched.agreeTerms && errors.agreeTerms && (
          <div className={styles.error}>{errors.agreeTerms}</div>
        )}
      </div>

      {/* 註冊按鈕 */}
      <button type="submit" className={styles.submitButton} disabled={isLoading}>
        {isLoading ? '註冊中...' : '註冊'} {/* TODO: i18n */}
      </button>
    </form>
  );
};

export default SignUpForm;
