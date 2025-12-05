/**
 * Authentication Service - Mock API
 * 模擬認證 API 回應（待後端實作後替換）
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

interface MockUser extends User {
  password: string;
}

// Mock 用戶資料庫（僅供開發測試-->接入api后要刪除）
const mockUsers: MockUser[] = [
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

// TODO: 頭像avatar要從後端取得
const mapUserResponseToUser = (data: {
  userId: string;
  loginId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}): User => {
  return {
    id: data.userId,
    loginId: data.loginId,
    name: data.name,
    email: data.email,
    phone: data.phone ?? '',
    avatar: "https://media.tenor.com/fGLpFBW-QBoAAAAe/memecat.png",
  }
}

/**
 * 取得完整用戶資料：先打 /auth/profile 拿 userId，再打 /users/:id
 */
const fetchFullUser = async (): Promise<User> => {
  // 1) 先從 cookie 中的 accessToken 取得 profile
  const profile = await get<{ userId: string; loginId: string; role: string }>('/auth/profile');

  // 2) 再用 userId 去查 users/:id，拿完整資料
  const userDetail = await get<{
    userId: string;
    loginId: string;
    name: string;
    email: string;
    phone: string | null;
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
 * 註冊：POST /auth/register，成功後再自動登入
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
  logout,
  getCurrentUser,
  validateToken,
};
