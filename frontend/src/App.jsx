import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import APIKeys from './pages/APIKeys';
import Settings from './pages/Settings';
import Docs from './pages/Docs';
import Admin from './pages/Admin';
import { useAuth } from './contexts/AuthContext';

// 管理员保护组件
function AdminProtected({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="api-keys" element={<APIKeys />} />
        <Route path="settings" element={<Settings />} />
        <Route path="docs" element={<Docs />} />
        <Route
          path="admin"
          element={
            <AdminProtected>
              <Admin />
            </AdminProtected>
          }
        />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
    </Routes>
  );
}

export default App;
