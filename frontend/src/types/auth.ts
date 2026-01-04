// User related types
export interface User {
  userId: string;
  loginId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'admin';  
}

// Auth API response types
export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  valid: boolean;
}

export interface GetUserResponse {
  success: boolean;
  user: User;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

// Auth context types
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<AuthResponse>;
  register: (loginId: string, name: string, email: string, phone: string, password: string) => Promise<AuthResponse>;
  registerWithVerification: {
    sendCode: (loginId: string, name: string, email: string, phone: string, password: string) => Promise<void>;
    verifyCode: (email: string, code: string) => Promise<AuthResponse>;
    resendCode: (email: string) => Promise<void>;
  };
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}
