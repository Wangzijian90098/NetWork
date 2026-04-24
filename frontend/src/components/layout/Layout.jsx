import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu, X } from 'lucide-react';
import './Layout.css';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="console-shell">
      {/* 移动端侧边栏遮罩 */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 侧边栏 */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>

      {/* 移动端菜单按钮 */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <main className="main">
        <Header />
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
