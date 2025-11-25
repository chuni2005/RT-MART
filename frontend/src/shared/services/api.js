/**
 * API Service - Fetch wrapper with token support
 * 統一的 API 請求處理層
 */

const API_BASE_URL = '/api';

/**
 * 取得儲存的 token（優先從 localStorage，其次 sessionStorage）
 */
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * 統一的 Fetch 請求封裝
 * @param {string} endpoint - API 端點（例如：'/auth/login'）
 * @param {object} options - Fetch 選項
 * @returns {Promise} API 回應
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // 處理 HTTP 錯誤狀態
      throw new Error(data.message || `HTTP Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // 處理網路錯誤或其他異常
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * GET 請求
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
};

/**
 * POST 請求
 */
export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * PUT 請求
 */
export const put = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE 請求
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
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
