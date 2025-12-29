/**
 * API Service - Fetch wrapper with token support
 * 統一的 API 請求處理層，支援自動 token 刷新
 */

const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
  _retry?: boolean; // 內部標記，防止無限重試
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

/**
 * 當 token 刷新完成時，通知所有等待的請求
 */
const onRefreshed = (success: boolean) => {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
};

/**
 * 將請求加入等待佇列
 */
const addRefreshSubscriber = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * 刷新 access token
 */
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

/**
 * 統一的 Fetch 請求封裝
 * @param endpoint - API 端點（例如：'/auth/login'）
 * @param options - Fetch 選項
 * @returns API 回應
 */
const apiRequest = async <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const isFormData = options.body instanceof FormData;

  const config: RequestOptions = {
    ...options,
    credentials: 'include', // 确保发送 cookie
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  let data: any = null;
  const text = await response.text();

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    // 如果是 401 錯誤且不是刷新請求本身，嘗試刷新 token
    if (response.status === 401 && !options._retry && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshSuccess = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(refreshSuccess);
        
        if (refreshSuccess) {
          // Token 刷新成功，重試原始請求
          options._retry = true;
          return apiRequest<T>(endpoint, options);
        } else {
          throw new Error('Session expired. Please login again.');
        }
      } else {
        // 如果已經在刷新中，等待刷新完成
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success: boolean) => {
            if (success) {
              options._retry = true;
              apiRequest<T>(endpoint, options).then(resolve).catch(reject);
            } else {
              reject(new Error('Session expired. Please login again.'));
            }
          });
        });
      }
    }

    // 處理其他 HTTP 錯誤狀態
    let errorMessage = `HTTP Error: ${response.status}`;

    if (data) {
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        // NestJS validation errors 可能回傳 message 陣列
        errorMessage = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
      } else if (data.error) {
        errorMessage = data.error;
      }
    }

    throw new Error(errorMessage);
  }

  return data;
};

/**
 * GET 請求
 */
export const get = <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'GET',
    ...options,
  });
};

/**
 * POST 請求
 */
export const post = <T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
    ...options,
  });
};

/**
 * PUT 請求
 */
export const put = <T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
    ...options,
  });
};

/**
 * PATCH 請求
 */
export const patch = <T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE 請求
 */
export const del = <T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    ...options,
  });
};

export default {
  get,
  post,
  put,
  patch,
  delete: del,
};
