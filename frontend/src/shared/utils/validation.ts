/**
 * 表單驗證工具函數
 */

import { ValidationError, PasswordStrength } from '@/types';
import i18n from "../components/Header/i18n";
/**
 * Email 格式驗證
 */
export const validateEmail = (email: string, t: (key: string) => string): ValidationError => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return t('validation.email.invalid');
  }

  return null;
};

/**
 * 密碼驗證（基本）
 */
export const validatePassword = (password: string, t: (key: string) => string): ValidationError => {
  if (password.length < 6) {
    return t('validation.password.min');
  }

  return null;
};

/**
 * 密碼強度驗證（註冊用）
 */
export const validatePasswordStrength = (password: string, t: (key: string) => string): ValidationError => {
  if (password.length < 8) {
    return t('validation.password.strength_min');
  }

  if (password.length > 20) {
    return t('validation.password.strength_max');
  }

  // 檢查是否包含大寫字母
  if (!/[A-Z]/.test(password)) {
    return t('validation.password.strength_upper');
  }

  // 檢查是否包含小寫字母
  if (!/[a-z]/.test(password)) {
    return t('validation.password.strength_lower');
  }

  // 檢查是否包含數字
  if (!/[0-9]/.test(password)) {
    return t('validation.password.strength_number');
  }

  return null;
};

/**
 * 計算密碼強度等級
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { level: 'weak', score: 0 };
  }

  let score = 0;

  // 長度評分
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // 包含小寫字母
  if (/[a-z]/.test(password)) score++;

  // 包含大寫字母
  if (/[A-Z]/.test(password)) score++;

  // 包含數字
  if (/[0-9]/.test(password)) score++;

  // 包含特殊字元
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // 計算強度等級
  let level: PasswordStrength['level'] = 'weak';
  if (score >= 4) level = 'medium';
  if (score >= 5) level = 'strong';

  return { level, score };
};

/**
 * 確認密碼驗證
 */
export const validateConfirmPassword = (password: string, confirmPassword: string, t: (key: string) => string): ValidationError => {
  if (password !== confirmPassword) {
    return t('validation.password.confirm_mismatch');
  }

  return null;
};

/**
 * 姓名驗證
 */
export const validateName = (name: string, t: (key: string) => string): ValidationError => {
  if (name.trim().length < 2) {
    return t('validation.name.min');
  }

  if (name.length > 50) {
    return t('validation.name.max');
  }

  return null;
};

/**
 * 帳號驗證（login_id）
 */
export const validateUsername = (username: string, t: (key: string) => string): ValidationError => {
  if (username.length < 4) {
    return t('validation.username.min');
  }

  if (username.length > 20) {
    return t('validation.username.max');
  }

  // 允許英數字及安全符號（a-z, A-Z, 0-9, _, -, .）
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(username)) {
    return t('validation.username.invalid');
  }

  return null;
};

/**
 * 電話號碼驗證
 */
export const validatePhone = (phone: string, t: (key: string) => string): ValidationError => {
  // 台灣手機號碼格式：09XX-XXX-XXX 或 09XXXXXXXX
  const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
  if (!phoneRegex.test(phone)) {
    return t('validation.phone.invalid');
  }

  return null;
};

/**
 * 登入帳號驗證（支援 email 或 username）
 */
export const validateLoginIdentifier = (identifier: string, t: (key: string) => string): ValidationError => {
  // 如果包含 @，當作 email 驗證
  if (identifier.includes('@')) {
    return validateEmail(identifier, t);
  }

  // 否則當作 username 驗證
  return validateUsername(identifier, t);
};

/**
 * 銀行賬號 格式驗證
 */
export const validateBankAccount = (bank_account_reference: string, t: (key: string) => string): ValidationError => {
  const bank_account_referenceRegex = /^[0-9]{3}-[0-9]+$/;
  if (!bank_account_referenceRegex.test(bank_account_reference)) {
    return t('validation.bank.invalid');
  }

  return null;
};

/**
 * 通用必填驗證
 */
export const validateRequired = (value: string, fieldName = '此欄位'): ValidationError => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return i18n.t("validation.common.required", { fieldName })
  }
  return null;
};
