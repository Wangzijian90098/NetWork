import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// 添加 User ID header (New API 需要)
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['New-Api-User'] = userId;
  }
  return config;
});

export const apiService = {
  // 获取用户信息
  getUserInfo: () => api.get('/user/self'),

  // 获取所有 Token (API Keys)
  getTokens: () => api.get('/token'),

  // 创建 Token
  createToken: (name, modelLimits) =>
    api.post('/token', { name, model_limits: modelLimits }),

  // 删除 Token
  deleteToken: (id) => api.delete(`/token/${id}`),

  // 获取 Token 完整 Key
  getTokenKey: (id) => api.post(`/token/${id}/key`),

  // 获取用量统计
  getUsage: (start, end) =>
    api.get('/usage', { params: { start, end } }),

  // 获取用户分组
  getGroups: () => api.get('/user/self/groups'),
};
