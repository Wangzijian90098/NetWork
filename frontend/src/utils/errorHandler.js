import axios from 'axios';
import { Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';

// 错误码映射
const ERROR_MESSAGES = {
  400: '请求参数错误',
  401: '未登录或登录已过期，请重新登录',
  403: '没有权限访问此资源',
  404: '请求的资源不存在',
  422: '请求参数验证失败',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用',
  NETWORK_ERROR: '网络连接失败，请检查网络',
};

// 业务错误码
const BUSINESS_ERRORS = {
  INVALID_CREDENTIALS: '邮箱或密码错误',
  EMAIL_EXISTS: '该邮箱已被注册',
  USER_DISABLED: '账户已被禁用',
  INSUFFICIENT_BALANCE: '余额不足',
  API_KEY_INVALID: 'API Key 无效',
  API_KEY_INACTIVE: 'API Key 已禁用',
  MODEL_NOT_FOUND: '不支持的模型',
  RATE_LIMITED: '请求超出限制',
};

// 提取错误信息
export function extractErrorMessage(error) {
  if (!error) return '未知错误';

  // 处理 Axios 错误
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // 优先使用 HTTP 状态码
    if (status && ERROR_MESSAGES[status]) {
      // 尝试从响应体中获取更详细的消息
      if (data?.message) return data.message;
      if (data?.error?.message) return data.error.message;
      return ERROR_MESSAGES[status];
    }

    // 处理网络错误
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试';
    }

    if (!error.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // 处理后端返回的业务错误
    const message = data?.message || data?.error?.message || BUSINESS_ERRORS[data?.code];
    if (message) return message;

    // 默认错误
    return error.message || '请求失败';
  }

  // 处理普通错误
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

// 显示错误 Toast
export function showErrorToast(error, duration = 3) {
  const message = extractErrorMessage(error);
  Toast.error(message, duration);
}

// 显示成功 Toast
export function showSuccessToast(message, duration = 3) {
  Toast.success(message, duration);
}

// 创建 Axios 错误拦截器
export function createErrorInterceptor(getNavigate) {
  return (error) => {
    const status = error.response?.status;
    const navigate = getNavigate?.() || (typeof window !== 'undefined' && window.__reactRouterNavigate);

    // 401 未授权，跳转登录
    if (status === 401) {
      localStorage.removeItem('token');
      if (navigate) {
        navigate('/login', { replace: true });
      }
      showErrorToast('登录已过期，请重新登录');
      return Promise.reject(new Error('登录已过期'));
    }

    // 403 禁止访问
    if (status === 403) {
      showErrorToast('没有权限访问此资源');
      return Promise.reject(error);
    }

    // 其他错误，显示消息
    const message = extractErrorMessage(error);
    if (message && message !== '登录已过期') {
      showErrorToast(message);
    }

    return Promise.reject(error);
  };
}

// API 请求包装器
export async function apiRequest(promise, options = {}) {
  const { silent = false, successMessage } = options;

  try {
    const response = await promise;

    if (successMessage) {
      showSuccessToast(successMessage);
    }

    return response;
  } catch (error) {
    if (!silent) {
      showErrorToast(error);
    }
    throw error;
  }
}

// Token 刷新逻辑
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

export { subscribeTokenRefresh, onTokenRefreshed, isRefreshing };

// 重置刷新状态
export function resetRefreshState() {
  isRefreshing = false;
  refreshSubscribers = [];
}
