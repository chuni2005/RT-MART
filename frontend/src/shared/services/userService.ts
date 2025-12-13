/**
 * User Service - Mock API
 * 使用者相關服務（個人資料、密碼、帳號管理）
 * 模擬 API 回應（待後端實作後替換）
 */

import { User, UpdateProfileRequest, UpdatePasswordRequest, ApiResponse } from '@/types';

/**
 * 模擬 API 延遲
 */
const delay = (ms = 400): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 更新個人資料
 * TODO: 替換為 PUT /api/v1/user/profile
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  console.log('[Mock API] Update profile:', data);

  await delay();

  // Mock 實作：從 localStorage 讀取並更新
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('使用者未登入');
  }

  const user = JSON.parse(userStr) as User;
  const updatedUser: User = {
    ...user,
    ...data,
  };

  // 儲存更新後的資料
  localStorage.setItem('user', JSON.stringify(updatedUser));

  return updatedUser;
};

/**
 * 更新密碼
 * TODO: 替換為 PUT /api/v1/user/password
 */
export const updatePassword = async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
  console.log('[Mock API] Update password');

  await delay();

  // Mock 實作：實際應由後端驗證目前密碼
  // 這裡僅模擬成功回應
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('使用者未登入');
  }

  // 模擬密碼驗證（實際應在後端進行）
  // 這裡簡化處理，假設 currentPassword 總是正確
  if (data.newPassword.length < 8) {
    throw new Error('新密碼長度至少需要 8 個字元');
  }

  return {
    success: true,
    message: '密碼更新成功',
  };
};

/**
 * 刪除帳號
 * TODO: 替換為 DELETE /api/v1/user/account
 */
export const deleteAccount = async (password: string): Promise<ApiResponse> => {
  console.log('[Mock API] Delete account');

  await delay(500);

  // Mock 實作：驗證密碼後刪除本地資料
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('使用者未登入');
  }

  // 模擬密碼驗證（實際應在後端進行）
  // 這裡簡化處理，假設密碼總是正確

  // 清除所有使用者相關資料
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');

  return {
    success: true,
    message: '帳號已刪除',
  };
};