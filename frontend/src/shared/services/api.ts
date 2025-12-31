/**
 * API Service - Fetch wrapper with token support
 * 統一的 API 請求處理層
 */

const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

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
    // 處理 HTTP 錯誤狀態
    // NestJS 錯誤格式可能是 { message: string } 或 { message: string[] }
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
