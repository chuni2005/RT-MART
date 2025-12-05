/**
 * API Service - Fetch wrapper with token support
 * 統一的 API 請求處理層
 */

const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * 取得儲存的 token（優先從 localStorage，其次 sessionStorage）
 */
const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * 統一的 Fetch 請求封裝
 * @param endpoint - API 端點（例如：'/auth/login'）
 * @param options - Fetch 選項
 * @returns API 回應
 */
const apiRequest = async <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {

  const config: RequestOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  // const data = await response.json();
  let data: any = null;
  const text = await response.text();


  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    // 處理 HTTP 錯誤狀態
    throw new Error(data.message || `HTTP Error: ${response.status}`);
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
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * PUT 請求
 */
export const put = <T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE 請求
 */
export const del = <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
};

export default {
  get,
  post,
  put,
  delete: del,
};
