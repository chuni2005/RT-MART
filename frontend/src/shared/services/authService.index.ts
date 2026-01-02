/**
 * Authentication Service Entry Point
 * 根據環境變數自動選擇 Mock API 或真實 API
 */

import realAuthService from './authService';
import mockAuthService from './authService.mock';

// 檢查是否使用 Mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// 根據環境變數導出對應的服務
const authService = USE_MOCK_API ? mockAuthService : realAuthService;

export const {
  login,
  register,
  sendVerificationCode,
  verifyRegistrationCode,
  resendVerificationCode,
  logout,
  getCurrentUser,
  validateToken
} = authService;

export default authService;
