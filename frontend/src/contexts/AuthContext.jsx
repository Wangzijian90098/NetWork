import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { showErrorToast } from '../utils/errorHandler';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await apiService.getProfile();
      if (data.success) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 静默处理 401 错误
      if (err.response?.status !== 401) {
        console.error('Auth check failed:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await apiService.login(email, password);
      if (data.success) {
        await checkAuth();
        return { success: true, message: '登录成功' };
      } else {
        return { success: false, message: data.message || '登录失败' };
      }
    } catch (err) {
      const message = err.response?.data?.message || '登录失败，请检查邮箱和密码';
      showErrorToast(message);
      return { success: false, message };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await apiService.register(email, password, name);
      if (data.success) {
        return { success: true, message: '注册成功' };
      } else {
        return { success: false, message: data.message || '注册失败' };
      }
    } catch (err) {
      const message = err.response?.data?.message || '注册失败，请稍后重试';
      showErrorToast(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
