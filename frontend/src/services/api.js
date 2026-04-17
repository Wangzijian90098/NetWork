import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  getUserInfo: () => api.get('/user/info'),
  getTokens: () => api.get('/token'),
  createToken: (name, modelLimits) =>
    api.post('/token', { name, modelLimits }),
  deleteToken: (id) => api.delete(`/token/${id}`),
  getUsage: (start, end) =>
    api.get('/usage', { params: { start, end } }),
};
