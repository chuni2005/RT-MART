/**
 * Authentication Service
 * 認證相關服務 (登入、註冊、登出、身份驗證)
 */

import { post } from './api';
import { 
  User, 
  AuthResponse, 
  ValidateTokenResponse, 
  GetUserResponse, 
  LogoutResponse 
} from '@/types';
import { get } from './api';

// TODO: 頭像avatar要從後端取得
export const mapUserResponseToUser = (data: {
  userId: string;
  loginId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl?: string | null;
  role: string;
}): User => {
  return {
    userId: data.userId,
    loginId: data.loginId,
    name: data.name,
    email: data.email,
    phone: data.phoneNumber ?? '',
    avatar: data.avatarUrl || "https://media.tenor.com/fGLpFBW-QBoAAAAe/memecat.png",
    role: data.role as 'buyer' | 'seller' | 'admin',
  }
}

/**
 * 取得完整用戶資料：先從 JWT 取得 profile，再用 userId 查完整資料
 */
const fetchFullUser = async (): Promise<User> => {
  // 1) 從後端 /auth/profile 取得 JWT payload 中的基本資訊
  const profile = await get<{ userId: string; loginId: string; role: string }>('/auth/profile');

  // 2) 使用 userId 取得完整用戶細節
  const userDetail = await get<{
    userId: string;
    loginId: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    role: string;
  }>(`/users/${profile.userId}`);

  return mapUserResponseToUser(userDetail);
}

/**
 * 登入：呼叫 /auth/login，cookies 內會寫入 token，然後再查完整用戶資料
 */
export const login = async (
  loginId: string, 
  password: string
): Promise<AuthResponse> => {
  try {
    // 1) 先登入，後端會把 accessToken / refreshToken 寫進 httpOnly cookies
    const tokenResult = await post<{
      accessToken: string;
      refreshToken: string;
    }>(
      '/auth/login', 
      { loginId, password }
    );

    // 2) 再拿用戶資料
    const user = await fetchFullUser();

    return {
      success: true,
      message: '登入成功!',
      user,
      // 前端型別裡有 token 欄位沿用後端回來的 accessToken
      token: tokenResult.accessToken,
    }
  } catch (error: any) {
    throw new Error(error.message || '登入失敗，請檢查賬號密碼');
  }
};

/**
 * 發送註冊驗證碼：POST /auth/register/send-code
 */
export const sendVerificationCode = async (
  loginId: string,
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await post<{ success: boolean; message: string }>(
      '/auth/register/send-code',
      {
        loginId,
        name,
        email,
        phoneNumber: phone,
        password,
        purpose: 'registration',
      }
    );
    return result;
  } catch (error: any) {
    throw new Error(error.message || '發送驗證碼失敗');
  }
};

/**
 * 驗證註冊碼並完成註冊：POST /auth/register/verify
 * 成功後會自動登入（後端會設置 cookies）
 */
export const verifyRegistrationCode = async (
  email: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const result = await post<{
      success: boolean;
      userId: string;
      accessToken: string;
      refreshToken: string;
    }>(
      '/auth/register/verify',
      { email, code }
    );

    if (!result.success) {
      throw new Error('驗證失敗');
    }

    // 取得完整用戶資料
    const user = await fetchFullUser();

    return {
      success: true,
      message: '註冊成功！',
      user,
      token: result.accessToken,
    };
  } catch (error: any) {
    throw new Error(error.message || '驗證碼錯誤或已過期');
  }
};

/**
 * 重新發送驗證碼：POST /email-verification/resend
 */
export const resendVerificationCode = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await post<{ success: boolean; message: string }>(
      '/email-verification/resend',
      { email, purpose: 'registration' }
    );
    return result;
  } catch (error: any) {
    throw new Error(error.message || '重新發送驗證碼失敗');
  }
};

/**
 * 註冊：POST /auth/register，成功後再自動登入
 * @deprecated 已棄用，請使用 sendVerificationCode + verifyRegistrationCode
 */
export const register = async (
  loginId: string,
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<AuthResponse> => {
  try {
    //後端 DTO 是 phoneNumber, 不是 phone
    const result = await post<{
      success: boolean;
      userId:string
    }>(
      '/auth/register',
      {
        loginId,
        name,
        email,
        phoneNumber: phone,
        password,
      },
    );

    if (!result.success) {
      throw new Error('注冊失敗');
    }

    // 注冊成功後，自動登入
    return await login(loginId, password);
  } catch (error: any) {
    throw new Error(error.message || '注冊失敗');
  };
};

/**
 * 登出：/auth/logout，清除後端 refresh/access token
 */
export const logout = async (): Promise<LogoutResponse> => {

  try {
    const res = await post<{ success: boolean }>('/auth/logout');
    return {
      success: res.success,
      message: '登出成功',
    };
  } catch {
    // 即使 API 失敗，前端一樣清楚本地狀態
    return {
      success: true,
      message: '登出成功',
    }
  }
};

/**
 * 取得當前用戶資訊：直接用上面的 fetchFullUser
 */
export const getCurrentUser = async (): Promise<GetUserResponse> => {
  try {
    const user = await fetchFullUser();
    return {
      success: true,
      user,
    };
  } catch (error: any) {
    throw new Error(error.message || '取得用戶資訊失敗');
  }
};

/**
 * 驗證目前是否已登入：能不能成功拿到 user
 */
export const validateToken = async (): Promise<ValidateTokenResponse> => {
  try {
    await fetchFullUser();
    return {
      success: true,
      valid: true,
    };
  } catch {
    return {
      success: true,
      valid: false,
    };
  }
};

export default {
  login,
  register,
  sendVerificationCode,
  verifyRegistrationCode,
  resendVerificationCode,
  logout,
  getCurrentUser,
  validateToken,
};
