import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const apiService = {
  // 使用统计
  getUsageStats: () => api.get('/usage/stats'),
  getUsageTrend: (days = 7) => api.get('/usage/trend', { params: { days } }),
  getModelDistribution: () => api.get('/usage/models'),

  // API Keys 管理
  getKeys: () => api.get('/keys'),
  createKey: (name) => api.post('/keys', { name }),
  deleteKey: (id) => api.delete(`/keys/${id}`),
  toggleKey: (id) => api.patch(`/keys/${id}/toggle`),
  getKey: (id) => api.get(`/keys/${id}`),

  // 认证
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};
