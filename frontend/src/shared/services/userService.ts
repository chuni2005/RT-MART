/**
 * User Service - API Integration
 * 使用者相關服務（個人資料、密碼、帳號管理）
 */

import { patch, del } from './api';
import { User, UpdateProfileRequest, UpdatePasswordRequest, ApiResponse } from '@/types';
import { mapUserResponseToUser } from './authService';

/**
 * 後端 User Response DTO 結構
 */
interface BackendUser {
  userId: string;
  loginId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 更新個人資料
 * 呼叫 PATCH /users/me
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  try {
    // 後端接收 UpdateUserDto，屬性名稱為 phoneNumber
    const backendUser = await patch<BackendUser>('/users/me', {
      name: data.name,
      email: data.email,
      phoneNumber: data.phone, // 映射前端 phone 到底層 phoneNumber
    });
    
    const updatedUser = mapUserResponseToUser(backendUser);
    
    // 同步更新 localStorage 中的使用者資訊（如果存在）
    const userStr = localStorage.getItem('user');
    if (userStr) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  } catch (error) {
    console.error('[API Error] updateProfile:', error);
    throw error;
  }
};

/**
 * 更新密碼
 * 呼叫 PATCH /users/me 並驗證舊密碼
 */
export const updatePassword = async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
  try {
    // 後端 UpdateUserDto 支援 password 與 currentPassword
    await patch('/users/me', {
      currentPassword: data.currentPassword,
      password: data.newPassword,
    });

    return {
      success: true,
      message: '密碼更新成功',
    };
  } catch (error) {
    console.error('[API Error] updatePassword:', error);
    throw error;
  }
};

/**
 * 刪除帳號
 * 呼叫 DELETE /users/me 並驗證密碼
 */
export const deleteAccount = async (password: string): Promise<ApiResponse> => {
  try {
    // 後端接收 DeleteAccountDto { password }
    await del('/users/me', { password });

    return {
      success: true,
      message: '帳號已刪除',
    };
  } catch (error) {
    console.error('[API Error] deleteAccount:', error);
    throw error;
  }
};

export default {
  updateProfile,
  updatePassword,
  deleteAccount,
};
