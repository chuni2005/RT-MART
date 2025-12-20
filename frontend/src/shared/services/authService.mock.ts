/**
 * Mock Authentication Service
 * 前端獨立開發時使用的 Mock API
 */

import {
  User,
  AuthResponse,
  ValidateTokenResponse,
  GetUserResponse,
  LogoutResponse,
} from "@/types";

interface MockUser extends User {
  password: string;
}

// Mock 用戶資料庫
const mockUsers: MockUser[] = [
  {
    id: "1",
    loginId: "hahahai0816",
    name: "測試用戶",
    email: "test@rtmart.com",
    phone: "0912-345-678",
    password: "Test1234",
    avatar: "https://media.tenor.com/fGLpFBW-QBoAAAAe/memecat.png",
    role: "buyer",
  },
  {
    id: "2",
    loginId: "seller01",
    name: "賣家用戶",
    email: "seller@rtmart.com",
    phone: "0933-222-111",
    password: "Seller1234",
    avatar:
      "https://i.pinimg.com/1200x/00/79/b7/0079b7d0d38bc285def998d2aacfb7e5.jpg",
    role: "seller",
  },
  {
    id: "3",
    loginId: "admin",
    name: "管理員",
    email: "admin@rtmart.com",
    phone: "0987-654-321",
    password: "Admin1234",
    avatar:
      "https://i0.wp.com/suddenlycat.com/wp-content/uploads/2020/09/SC-Blog-Background-v1-1.jpg?w=1024&ssl=1",
    role: "admin",
  },
];

/**
 * Mock 登入
 */
export const mockLogin = async (
  loginId: string,
  password: string
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.loginId === loginId && u.password === password
      );

      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        const mockToken = `mock_token_${Date.now()}`;

        // 儲存到 localStorage 模擬登入狀態
        localStorage.setItem("mockAuthToken", mockToken);
        localStorage.setItem("mockUser", JSON.stringify(userWithoutPassword));

        resolve({
          success: true,
          message: "登入成功!",
          user: userWithoutPassword,
          token: mockToken,
        });
      } else {
        reject(new Error("登入失敗，請檢查賬號密碼"));
      }
    }, 500); // 模擬網絡延遲
  });
};

/**
 * Mock 註冊
 */
export const mockRegister = async (
  loginId: string,
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 檢查用戶是否已存在
      const existingUser = mockUsers.find(
        (u) => u.loginId === loginId || u.email === email
      );

      if (existingUser) {
        reject(new Error("用戶已存在"));
        return;
      }

      // 創建新用戶
      const newUser: MockUser = {
        id: String(mockUsers.length + 1),
        loginId,
        name,
        email,
        phone,
        password,
        avatar: "https://media.tenor.com/fGLpFBW-QBoAAAAe/memecat.png",
        role: "buyer",
      };

      mockUsers.push(newUser);

      const { password: _, ...userWithoutPassword } = newUser;
      const mockToken = `mock_token_${Date.now()}`;

      localStorage.setItem("mockAuthToken", mockToken);
      localStorage.setItem("mockUser", JSON.stringify(userWithoutPassword));

      resolve({
        success: true,
        message: "註冊成功!",
        user: userWithoutPassword,
        token: mockToken,
      });
    }, 500);
  });
};

/**
 * Mock 登出
 */
export const mockLogout = async (): Promise<LogoutResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.removeItem("mockAuthToken");
      localStorage.removeItem("mockUser");

      resolve({
        success: true,
        message: "登出成功",
      });
    }, 300);
  });
};

/**
 * Mock 取得當前用戶
 */
export const mockGetCurrentUser = async (): Promise<GetUserResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const token = localStorage.getItem("mockAuthToken");
      const userStr = localStorage.getItem("mockUser");

      if (!token || !userStr) {
        reject(new Error("未登入"));
        return;
      }

      try {
        const user = JSON.parse(userStr) as User;
        resolve({
          success: true,
          user,
        });
      } catch {
        reject(new Error("取得用戶資訊失敗"));
      }
    }, 300);
  });
};

/**
 * Mock 驗證 Token
 */
export const mockValidateToken = async (): Promise<ValidateTokenResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const token = localStorage.getItem("mockAuthToken");
      const userStr = localStorage.getItem("mockUser");

      resolve({
        success: true,
        valid: !!(token && userStr),
      });
    }, 200);
  });
};

export default {
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  getCurrentUser: mockGetCurrentUser,
  validateToken: mockValidateToken,
};
