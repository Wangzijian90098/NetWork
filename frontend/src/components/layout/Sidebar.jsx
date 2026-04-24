import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Settings, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: '控制台' },
  { to: '/app/api-keys', icon: Key, label: 'API Keys' },
  { to: '/app/docs', icon: BookOpen, label: '文档' },
  { to: '/app/settings', icon: Settings, label: '设置' },
];

function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge">
          <span className="text-white font-bold">N</span>
        </div>
        <span>NetWork AI</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} className="inline mr-3" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              `sidebar-link admin-link ${isActive ? 'active' : ''}`
            }
          >
            <Shield size={18} className="inline mr-3" />
            管理后台
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
