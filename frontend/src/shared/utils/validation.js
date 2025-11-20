/**
 * 表單驗證工具函數
 */

/**
 * Email 格式驗證
 * @param {string} email
 * @returns {string|null} 錯誤訊息或 null
 */
export const validateEmail = (email) => {
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
 * @param {string} password
 * @returns {string|null} 錯誤訊息或 null
 */
export const validatePassword = (password) => {
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
 * @param {string} password
 * @returns {string|null} 錯誤訊息或 null
 */
export const validatePasswordStrength = (password) => {
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
 * @param {string} password
 * @returns {object} { level: 'weak'|'medium'|'strong', score: 0-4 }
 */
export const calculatePasswordStrength = (password) => {
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
  let level = 'weak';
  if (score >= 4) level = 'medium';
  if (score >= 5) level = 'strong';

  return { level, score };
};

/**
 * 確認密碼驗證
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {string|null} 錯誤訊息或 null
 */
export const validateConfirmPassword = (password, confirmPassword) => {
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
 * @param {string} name
 * @returns {string|null} 錯誤訊息或 null
 */
export const validateName = (name) => {
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
 * @param {string} username
 * @returns {string|null} 錯誤訊息或 null
 */
export const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return '帳號為必填欄位'; // TODO: i18n
  }

  if (username.length < 4) {
    return '帳號至少需要 4 個字元'; // TODO: i18n
  }

  if (username.length > 20) {
    return '帳號不能超過 20 個字元'; // TODO: i18n
  }

  // 只允許英數字（a-z, A-Z, 0-9）
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return '帳號只能包含英文字母和數字'; // TODO: i18n
  }

  return null;
};

/**
 * 電話號碼驗證
 * @param {string} phone
 * @returns {string|null} 錯誤訊息或 null
 */
export const validatePhone = (phone) => {
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
 * @param {string} identifier
 * @returns {string|null} 錯誤訊息或 null
 */
export const validateLoginIdentifier = (identifier) => {
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
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null} 錯誤訊息或 null
 */
export const validateRequired = (value, fieldName = '此欄位') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName}為必填欄位`; // TODO: i18n
  }
  return null;
};
