import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const apiService = {
  // 使用统计
  getUsageStats: () => api.get('/v1/account/usage'),
  getUsageTrend: (days = 7) => api.get('/v1/account/usage/trend', { params: { days } }),
  getModelDistribution: () => api.get('/v1/account/usage/models'),

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

  // 管理员
  adminGetUsers: () => api.get('/admin/users'),
  adminRecharge: (userId, amount) => api.post(`/admin/users/${userId}/recharge`, { amount }),
  adminGetPlatformKeys: () => api.get('/admin/platform-keys'),
  adminAddPlatformKey: (data) => api.post('/admin/platform-keys', data),
  adminDeletePlatformKey: (id) => api.delete(`/admin/platform-keys/${id}`),
  adminSync: () => api.get('/admin/sync'),
};
