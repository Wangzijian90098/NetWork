import { useState } from 'react';
import { Card, Input, Button, Toast } from '@douyinfe/semi-ui';
import { User, Mail, Lock, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Settings.css';

function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    usage: true,
    balance: false,
  });

  const handleProfileUpdate = async () => {
    if (!profile.name.trim()) {
      Toast.error('名称不能为空');
      return;
    }
    setLoading(true);
    try {
      // TODO: 调用更新用户信息 API
      Toast.success('个人信息已更新');
    } catch (err) {
      Toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (password.new.length < 6) {
      Toast.error('新密码至少 6 位');
      return;
    }
    if (password.new !== password.confirm) {
      Toast.error('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      // TODO: 调用修改密码 API
      Toast.success('密码已修改');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      Toast.error('修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings">
      <h1>账户设置</h1>

      {/* 个人信息 */}
      <Card className="settings-card">
        <div className="card-header">
          <User size={20} />
          <h2>个人信息</h2>
        </div>
        <div className="form-group">
          <label>名称</label>
          <Input
            value={profile.name}
            onChange={(v) => setProfile({ ...profile, name: v })}
            placeholder="输入名称"
          />
        </div>
        <div className="form-group">
          <label>邮箱</label>
          <Input
            value={profile.email}
            disabled
            prefix={<Mail size={16} />}
          />
        </div>
        <Button
          className="btn-primary"
          onClick={handleProfileUpdate}
          loading={loading}
        >
          保存修改
        </Button>
      </Card>

      {/* 修改密码 */}
      <Card className="settings-card">
        <div className="card-header">
          <Lock size={20} />
          <h2>修改密码</h2>
        </div>
        <div className="form-group">
          <label>当前密码</label>
          <Input
            type="password"
            value={password.current}
            onChange={(v) => setPassword({ ...password, current: v })}
            placeholder="输入当前密码"
          />
        </div>
        <div className="form-group">
          <label>新密码</label>
          <Input
            type="password"
            value={password.new}
            onChange={(v) => setPassword({ ...password, new: v })}
            placeholder="输入新密码（至少 6 位）"
          />
        </div>
        <div className="form-group">
          <label>确认密码</label>
          <Input
            type="password"
            value={password.confirm}
            onChange={(v) => setPassword({ ...password, confirm: v })}
            placeholder="再次输入新密码"
          />
        </div>
        <Button
          className="btn-primary"
          onClick={handlePasswordChange}
          loading={loading}
        >
          修改密码
        </Button>
      </Card>

      {/* 通知设置 */}
      <Card className="settings-card">
        <div className="card-header">
          <Bell size={20} />
          <h2>通知设置</h2>
        </div>
        <div className="toggle-group">
          <label>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
            />
            <span>邮件通知</span>
          </label>
          <p className="toggle-desc">接收账户相关的邮件通知</p>
        </div>
        <div className="toggle-group">
          <label>
            <input
              type="checkbox"
              checked={notifications.usage}
              onChange={(e) => setNotifications({ ...notifications, usage: e.target.checked })}
            />
            <span>使用报告</span>
          </label>
          <p className="toggle-desc">每周接收使用统计报告</p>
        </div>
        <div className="toggle-group">
          <label>
            <input
              type="checkbox"
              checked={notifications.balance}
              onChange={(e) => setNotifications({ ...notifications, balance: e.target.checked })}
            />
            <span>余额预警</span>
          </label>
          <p className="toggle-desc">余额低于阈值时发送通知</p>
        </div>
      </Card>
    </div>
  );
}

export default Settings;