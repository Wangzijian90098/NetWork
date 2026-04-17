import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const authService = {
  login: (email, password) =>
    api.post('/user/login', { email, password }),

  register: (email, password, name) =>
    api.post('/user/register', { email, password, name }),

  getUserInfo: () =>
    api.get('/user/info'),

  logout: () =>
    api.post('/user/logout'),
};
