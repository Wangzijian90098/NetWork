import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import APIKeys from './pages/APIKeys';

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
        <Route path="api-keys" element={<APIKeys />} />
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
