import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

function Layout() {
  return (
    <div className="console-shell">
      <Sidebar />
      <main className="main">
        <Header />
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
