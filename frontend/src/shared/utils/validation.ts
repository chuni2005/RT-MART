/**
 * 表單驗證工具函數
 */

import { ValidationError, PasswordStrength } from '@/types';

/**
 * Email 格式驗證
 */
export const validateEmail = (email: string): ValidationError => {
  if (!email || email.trim() === '') {
    return 'Email 為必填欄位'; // TODO: i18n
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email 格式不正確'; // TODO: i18n
  }

  return null;
};

/**
 * 密碼驗證（基本）
 */
export const validatePassword = (password: string): ValidationError => {
  if (!password || password.trim() === '') {
    return '密碼為必填欄位'; // TODO: i18n
  }

  if (password.length < 6) {
    return '密碼至少需要 6 個字元'; // TODO: i18n
  }

  return null;
};

/**
 * 密碼強度驗證（註冊用）
 */
export const validatePasswordStrength = (password: string): ValidationError => {
  if (!password || password.trim() === '') {
    return '密碼為必填欄位'; // TODO: i18n
  }

  if (password.length < 8) {
    return '密碼至少需要 8 個字元'; // TODO: i18n
  }

  if (password.length > 20) {
    return '密碼不能超過 20 個字元'; // TODO: i18n
  }

  // 檢查是否包含大寫字母
  if (!/[A-Z]/.test(password)) {
    return '密碼必須包含至少一個大寫字母'; // TODO: i18n
  }

  // 檢查是否包含小寫字母
  if (!/[a-z]/.test(password)) {
    return '密碼必須包含至少一個小寫字母'; // TODO: i18n
  }

  // 檢查是否包含數字
  if (!/[0-9]/.test(password)) {
    return '密碼必須包含至少一個數字'; // TODO: i18n
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
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationError => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return '請確認密碼'; // TODO: i18n
  }

  if (password !== confirmPassword) {
    return '兩次輸入的密碼不一致'; // TODO: i18n
  }

  return null;
};

/**
 * 姓名驗證
 */
export const validateName = (name: string): ValidationError => {
  if (!name || name.trim() === '') {
    return '姓名為必填欄位'; // TODO: i18n
  }

  if (name.trim().length < 2) {
    return '姓名至少需要 2 個字元'; // TODO: i18n
  }

  if (name.length > 50) {
    return '姓名不能超過 50 個字元'; // TODO: i18n
  }

  return null;
};

/**
 * 帳號驗證（login_id）
 */
export const validateUsername = (username: string): ValidationError => {
  if (!username || username.trim() === '') {
    return '帳號為必填欄位'; // TODO: i18n
  }

  if (username.length < 4) {
    return '帳號至少需要 4 個字元'; // TODO: i18n
  }

  if (username.length > 20) {
    return '帳號不能超過 20 個字元'; // TODO: i18n
  }

  // 允許英數字及安全符號（a-z, A-Z, 0-9, _, -, .）
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(username)) {
    return '帳號只能包含英文字母、數字及符號（_ - .）'; // TODO: i18n
  }

  return null;
};

/**
 * 電話號碼驗證
 */
export const validatePhone = (phone: string): ValidationError => {
  if (!phone || phone.trim() === '') {
    return '電話號碼為必填欄位'; // TODO: i18n
  }

  // 台灣手機號碼格式：09XX-XXX-XXX 或 09XXXXXXXX
  const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
  if (!phoneRegex.test(phone)) {
    return '電話號碼格式不正確（例：0912-345-678）'; // TODO: i18n
  }

  return null;
};

/**
 * 登入帳號驗證（支援 email 或 username）
 */
export const validateLoginIdentifier = (identifier: string): ValidationError => {
  if (!identifier || identifier.trim() === '') {
    return '請輸入帳號或 Email'; // TODO: i18n
  }

  // 如果包含 @，當作 email 驗證
  if (identifier.includes('@')) {
    return validateEmail(identifier);
  }

  // 否則當作 username 驗證
  return validateUsername(identifier);
};

/**
 * 通用必填驗證
 */
export const validateRequired = (value: string, fieldName = '此欄位'): ValidationError => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName}為必填欄位`; // TODO: i18n
  }
  return null;
};
