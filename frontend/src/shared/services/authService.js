/**
 * Authentication Service - Mock API
 * 模擬認證 API 回應（待後端實作後替換）
 */

import { post } from './api';

// Mock 用戶資料庫（僅供開發測試-->接入api后腰刪除）
const mockUsers = [
  {
    id: "1",
    loginId: "hahahai",
    name: "測試用戶",
    email: "test@rtmart.com",
    phone: "0912-345-678",
    password: "Test1234",
    avatar: "https://media.tenor.com/fGLpFBW-QBoAAAAe/memecat.png",
  },
];

/**
 * 模擬 API 延遲
 */
const mockDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 登入（Mock 版本）
 * @param {string} identifier - 可以是 email/loginId
 * @param {string} password
 * @returns {Promise} { success: boolean, user: object, token: string }
 */
export const login = async (identifier, password) => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // return post('/auth/login', { identifier, password });

  console.log('[Mock API] Login attempt:', { identifier });

  // 模擬網路延遲
  await mockDelay(1000);

  // 模擬驗證邏輯 - 支援 email 或 loginId
  const user = mockUsers.find(u => u.email === identifier || u.loginId === identifier);

  if (!user) {
    throw new Error('帳號或 Email 不存在'); // TODO: i18n
  }

  if (user.password !== password) {
    throw new Error('密碼錯誤，請重新輸入'); // TODO: i18n
  }

  // 模擬成功回應
  const { password: _, ...userWithoutPassword } = user;
  const mockToken = `mock-jwt-token-${Date.now()}`;

  return {
    success: true,
    message: '登入成功！', // TODO: i18n
    user: userWithoutPassword,
    token: mockToken,
  };
};

/**
 * 註冊（Mock 版本）
 * @param {string} loginId - 登入帳號（永久，不可更改）
 * @param {string} name - 使用者名稱（註冊時 = loginId，後續可透過個人設定更改）
 * @param {string} email
 * @param {string} phone
 * @param {string} password
 * @returns {Promise} { success: boolean, user: object, token: string }
 */
export const register = async (loginId, name, email, phone, password) => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // return post('/auth/register', { loginId, name, email, phone, password });

  console.log('[Mock API] Register attempt:', { loginId, name, email, phone });

  // 模擬網路延遲
  await mockDelay(1200);

  // 檢查 loginId 是否已存在
  const existingLoginId = mockUsers.find(u => u.loginId === loginId);
  if (existingLoginId) {
    throw new Error('此帳號已被使用'); // TODO: i18n
  }

  // 檢查 Email 是否已存在
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    throw new Error('此 Email 已被註冊'); // TODO: i18n
  }

  // 模擬建立新用戶
  const newUser = {
    id: String(mockUsers.length + 1),
    loginId,
    name,
    email,
    phone,
    password, // 實際應用中絕不在前端存密碼！
    avatar: `https://i.pravatar.cc/150?img=${mockUsers.length + 2}`,
  };

  mockUsers.push(newUser);

  // 模擬成功回應（自動登入）
  const { password: _, ...userWithoutPassword } = newUser;
  const mockToken = `mock-jwt-token-${Date.now()}`;

  return {
    success: true,
    message: '註冊成功！已自動登入', // TODO: i18n
    user: userWithoutPassword,
    token: mockToken,
  };
};

/**
 * 登出（Mock 版本）
 * @returns {Promise} { success: boolean }
 */
export const logout = async () => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // return post('/auth/logout');

  console.log('[Mock API] Logout');

  // 模擬網路延遲
  await mockDelay(300);

  return {
    success: true,
    message: '登出成功', // TODO: i18n
  };
};

/**
 * 取得當前用戶資訊（Mock 版本）
 * @returns {Promise} { success: boolean, user: object }
 */
export const getCurrentUser = async () => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // return get('/auth/me');

  console.log('[Mock API] Get current user');

  // 模擬網路延遲
  await mockDelay(500);

  // 檢查是否有 token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    throw new Error('未登入'); // TODO: i18n
  }

  // 模擬回傳第一個用戶（實際應根據 token 解析）
  const user = mockUsers[0];
  const { password: _, ...userWithoutPassword } = user;

  return {
    success: true,
    user: userWithoutPassword,
  };
};

/**
 * 驗證 Token（Mock 版本）
 * @returns {Promise} { success: boolean, valid: boolean }
 */
export const validateToken = async () => {
  // TODO: 待後端 API 完成後，替換為真實 API 呼叫
  // return get('/auth/validate');

  console.log('[Mock API] Validate token');

  // 模擬網路延遲
  await mockDelay(300);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  return {
    success: true,
    valid: !!token && token.startsWith('mock-jwt-token-'),
  };
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  validateToken,
};
