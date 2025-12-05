/**
 * AuthContext - 全域認證狀態管理
 * 提供登入、註冊、登出功能和使用者狀態
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as authService from "../services/authService";
import { AuthContextValue, User, AuthResponse } from "@/types";

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 初始化：檢查是否有已儲存的 token
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * 檢查認證狀態
   */
  const checkAuth = async () => {
    try {
      // 呼叫後端：如果 cookies 中有合法 token ，就會回傳 user
      const { user: userData } = await authService.getCurrentUser();

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 登入
   * @param identifier - 現在當作 loginId 使用（後端目前只支援 loginId）
   * @param password
   * @param remember - 是否記住登入狀態（可選：你可以自己決定要不要把 user 存到 localStorage）
   */
  const login = async (
    identifier: string,
    password: string,
    remember = false
  ): Promise<AuthResponse> => {
    try {
      setIsLoading(true);

      // identifier 在這邊當作 loginId 傳給後端
      const response = await authService.login(identifier, password);

      if (response.success) {
        // 不再儲存 token（token 已在 httpOnly cookies 中）
        if (remember) {
          // 如果你想記住使用者資訊，可以存 user（非必須）
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        // 更新狀態
        setUser(response.user);
        setIsAuthenticated(true);

        return response;
      } else {
        throw new Error(response.message || "登入失敗"); // TODO: i18n
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 註冊
   * @param loginId - 登入帳號（永久，不可更改）
   * @param name - 使用者名稱（註冊時 = loginId，後續可透過個人設定更改）
   * @param email
   * @param phone
   * @param password
   */
  const register = async (
    loginId: string,
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      setIsLoading(true);

      const response = await authService.register(
        loginId,
        name,
        email,
        phone,
        password
      );

      if (response.success) {
        // 更新狀態
        setUser(response.user);
        setIsAuthenticated(true);

        return response;
      } else {
        throw new Error(response.message || "註冊失敗"); // TODO: i18n
      }
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      clearAuth();
    } catch (error) {
      console.error("Logout error:", error);
      // 即使 API 失敗，仍清除本地狀態
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清除認證狀態
   */
  const clearAuth = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * 更新使用者資訊
   */
  const updateUser = (userData: Partial<User>) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : null));
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook - 方便取用 AuthContext
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export default AuthContext;
