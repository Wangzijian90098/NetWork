import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';

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
        <Route path="dashboard" element={
          <div style={{ color: '#fff', padding: '20px' }}>
            <h1>Dashboard</h1>
          </div>
        } />
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
      <Route path="login" element={
        <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>
          <h1>Login Page</h1>
        </div>
      } />
    </Routes>
  );
}

export default App;
