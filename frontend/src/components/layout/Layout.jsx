import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`layout__overlay ${sidebarOpen ? 'layout__overlay--active' : ''}`}
           onClick={() => setSidebarOpen(false)} />
      <div className="layout__main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
