import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 允许携带 Cookie
});

export const authService = {
  // 登录 - New API 使用 username 字段
  login: (username, password) =>
    api.post('/user/login', { username, password }),

  // 注册
  register: (username, password, email) =>
    api.post('/user/register', { username, password, email }),

  // 获取当前用户信息
  getSelf: () =>
    api.get('/user/self'),

  // 退出登录
  logout: () =>
    api.get('/user/logout'),
};
