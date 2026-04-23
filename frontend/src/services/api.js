import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const apiService = {
  // 获取使用统计
  getUsageStats: () => api.get('/usage/stats'),

  // 获取趋势数据
  getUsageTrend: (days = 7) => api.get('/usage/trend', { params: { days } }),

  // 获取模型分布
  getModelDistribution: () => api.get('/usage/models'),

  // 获取所有 API Keys
  getKeys: () => api.get('/keys'),

  // 创建 API Key
  createKey: (name) => api.post('/keys', { name }),

  // 删除 API Key
  deleteKey: (id) => api.delete(`/keys/${id}`),

  // 启用/禁用 Key
  toggleKey: (id) => api.patch(`/keys/${id}/toggle`),
};
