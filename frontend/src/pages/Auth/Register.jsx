import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Toast } from '@douyinfe/semi-ui';
import { useAuth } from '../../hooks/useAuth';
import '../Auth/Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await register(email, password);
      if (result.success) {
        Toast.success('注册成功，请登录');
        navigate('/login');
      } else {
        setError(result.message || '注册失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>注册</h1>
        <p>创建新账户</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

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
              placeholder="至少 6 位"
              required
            />
          </div>

          <div className="field">
            <label>确认密码</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(v) => setConfirmPassword(v)}
              placeholder="再次输入密码"
              required
            />
          </div>

          <Button
            type="submit"
            className="btn-primary"
            loading={loading}
            disabled={!email || !password || !confirmPassword}
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
