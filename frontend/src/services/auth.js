import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password }),

  getSelf: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};
