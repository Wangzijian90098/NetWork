import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const pathNames = {
  '/app/dashboard': '仪表盘',
  '/app/api-keys': 'API Keys',
  '/app/docs': '文档',
  '/app/settings': '设置',
  '/app/admin': '管理后台',
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const pageName = pathNames[location.pathname] || '页面';

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h1 className="header__title">{pageName}</h1>
      </div>
      <div className="header__right">
        <div className="header__search">
          <Search size={18} />
          <input type="text" placeholder="搜索..." />
        </div>
        <button className="header__icon-btn">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
