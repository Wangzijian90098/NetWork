import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@douyinfe/semi-ui';
import { useAuth } from '../../contexts/AuthContext';
import '../Auth/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>登录</h1>
        <p>欢迎回来</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>邮箱</label>
            <Input
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="your@email.com"
              type="email"
              required
            />
          </div>

          <div className="field">
            <label>密码</label>
            <Input
              type="password"
              value={password}
              onChange={(v) => setPassword(v)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <Button
            type="submit"
            className="btn-primary"
            loading={loading}
            block
          >
            登录
          </Button>
        </form>

        <p className="auth-footer">
          还没有账户？<Link to="/register">立即注册</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
