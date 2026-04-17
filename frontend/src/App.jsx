import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={
          <div style={{ color: '#fff', padding: '20px' }}>
            <h1>Welcome to NetWork AI</h1>
          </div>
        } />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="api-keys" element={
          <div style={{ color: '#fff', padding: '20px' }}>
            <h1>API Keys</h1>
          </div>
        } />
        <Route path="settings" element={
          <div style={{ color: '#fff', padding: '20px' }}>
            <h1>Settings</h1>
          </div>
        } />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
    </Routes>
  );
}

export default App;
