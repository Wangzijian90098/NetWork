import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@douyinfe/semi-ui';
import './Header.css';

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="page-title">
        <h1>控制台</h1>
        <p>管理您的 AI API 访问</p>
      </div>
      <div className="user-chip">
        <span className="mr-3">user@example.com</span>
        <Button
          size="small"
          theme="borderless"
          icon={<LogOut size={16} />}
          onClick={handleLogout}
        />
      </div>
    </header>
  );
}

export default Header;
