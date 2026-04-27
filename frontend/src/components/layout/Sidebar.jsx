import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Key,
  FileText,
  Settings,
  Shield,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/app/api-keys', icon: Key, label: 'API Keys' },
  { path: '/app/docs', icon: FileText, label: '文档' },
  { path: '/app/settings', icon: Settings, label: '设置' },
];

const adminItems = [
  { path: '/app/admin', icon: Shield, label: '管理后台', adminOnly: true },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__inner">
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span>N</span>
          </div>
          <span className="sidebar__title">AI NetWork</span>
          <button className="sidebar__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <div className="sidebar__divider" />
          )}
          {user?.role === 'admin' && adminItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar__link sidebar__link--admin ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              <User size={18} />
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || '用户'}</span>
              <span className="sidebar__user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} title="退出登录">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
