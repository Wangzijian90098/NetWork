import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@douyinfe/semi-ui';
import { authService } from '../../services/auth';
import '../Auth/Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register(username, password, email);
      // New API 使用 Cookie 认证
      navigate('/app/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>注册</h1>
        <p>创建您的账户</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>用户名</label>
            <Input
              value={username}
              onChange={(v) => setUsername(v)}
              placeholder="用户名"
              required
            />
          </div>

          <div className="field">
            <label>邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="your@email.com"
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

          <Button
            type="submit"
            className="btn-primary"
            loading={loading}
            block
          >
            注册
          </Button>
        </form>

        <p className="auth-footer">
          已有账户？<Link to="/login">立即登录</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
