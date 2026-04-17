# New API 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 NetWork 项目重构为基于 New API 后端 + React 前端的完整 AI 网关系统

**Architecture:**
- 后端: Fork `C:\AI\new-api`，使用 Go + Gin + GORM + Redis
- 前端: React + Semi UI + Tailwind CSS，基于 New API 技术栈但融合 NetWork 深色科技风格
- 部署: Docker Compose

**Tech Stack:**
- 后端: Go 1.25+, Gin, GORM, Redis, SQLite/MySQL
- 前端: React 18, Vite, Tailwind CSS, Semi UI, i18next
- 部署: Docker, Docker Compose

---

## 文件结构

```
NetWork/
├── new-api/                    # 后端 (Fork 自 C:\AI\new-api)
│   ├── main.go
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── controller/
│   ├── service/
│   ├── model/
│   ├── relay/channel/          # 30+ AI 渠道适配器
│   ├── middleware/
│   ├── router/
│   └── common/
│
├── frontend/                   # 前端 (新项目)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing/        # 落地页 (含粒子背景)
│   │   │   ├── Auth/           # 登录/注册
│   │   │   ├── Dashboard/      # 控制台
│   │   │   ├── APIKeys/        # API Key 管理
│   │   │   └── Settings/       # 用户设置
│   │   ├── components/
│   │   │   ├── common/         # 通用组件
│   │   │   ├── layout/         # 布局组件
│   │   │   └── charts/         # 图表组件
│   │   ├── services/           # API 服务
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── i18n/               # 国际化
│   │   ├── styles/             # 全局样式
│   │   │   └── theme.css       # NetWork 风格变量
│   │   └── utils/              # 工具函数
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── docker/
    ├── docker-compose.yml
    └── init.sh
```

---

## 任务列表

### Task 1: Fork 并配置 New API 后端

**Files:**
- Create: `new-api/` (复制自 `C:\AI\new-api`)
- Modify: `new-api/.env.example` → `.env`
- Modify: `new-api/Dockerfile`
- Modify: `new-api/docker-compose.yml`

- [ ] **Step 1: Fork new-api 项目**

```bash
# 复制 new-api 到 NetWork/new-api
cp -r "C:/AI/new-api" "D:/NetWork/new-api"
cd "D:/NetWork/new-api"

# 初始化为新的 git 仓库
rm -rf .git
git init
git add .
git commit -m "chore: fork new-api as base backend"
```

- [ ] **Step 2: 创建 .env 配置文件**

```bash
cd "D:/NetWork/new-api"
cp .env.example .env
```

编辑 `.env` 内容:
```
AppID=network-ai-gateway
AppKey=change-me-in-production
MasterKey=change-me-in-production

# 数据库 (SQLite 开发)
SQL_DSN=/data/new-api.db

# Redis
REDIS_CONN_STRING=redis:6379

# 会话
SessionMode=jwt
SessionSecret=change-me-in-production
CRYPTO_SECRET=change-me-in-production

# 初始额度
InitialQuota=1000000

# 日志
LogLevel=info
EnableSysLog=false

# 基础路径
BaseURL=http://localhost:3000
```

- [ ] **Step 3: 验证后端运行**

```bash
cd "D:/NetWork/new-api"

# 初始化数据库
go run main.go -migratedata

# 启动服务 (后台)
go run main.go &

# 验证
curl http://localhost:3000/api/v1/status
# 期望: {"status":"ok"}
```

- [ ] **Step 4: 提交**

```bash
cd "D:/NetWork"
git add new-api/
git commit -m "feat: fork new-api backend"
```

---

### Task 2: 初始化 React 前端项目

**Files:**
- Create: `frontend/` (Vite + React 项目)
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`

- [ ] **Step 1: 创建前端目录结构**

```bash
cd "D:/NetWork"
mkdir -p frontend/src/{pages,components/{common,layout,charts},services,hooks,i18n,styles,utils}
```

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "network-ai-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.3.0",
    "@douyinfe/semi-ui": "^2.69.1",
    "@douyinfe/semi-icons": "^2.63.1",
    "axios": "^1.6.0",
    "dayjs": "^1.11.11",
    "i18next": "^23.16.8",
    "react-i18next": "^13.0.0",
    "i18next-browser-languagedetector": "^7.2.0",
    "lucide-react": "^0.511.0",
    "react-markdown": "^10.1.0",
    "sse.js": "^2.6.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.5.0",
    "autoprefixer": "^10.4.21"
  }
}
```

- [ ] **Step 3: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: 创建 tailwind.config.js (NetWork 深色风格)**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0f1a',
        panel: '#111827',
        'panel-2': '#0f172a',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        muted: '#94a3b8',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        xl: '18px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NetWork AI - AI API 中转平台</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 6: 创建 src/main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 7: 创建 src/App.jsx**

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import APIKeys from './pages/APIKeys';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="api-keys" element={<APIKeys />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
```

- [ ] **Step 8: 创建 src/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0a0f1a;
  --panel: #111827;
  --panel-2: #0f172a;
  --text: #ffffff;
  --muted: #94a3b8;
  --line: #1f2937;
  --primary: #3b82f6;
  --secondary: #8b5cf6;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
}

body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.gradient-text {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

- [ ] **Step 9: 安装依赖并验证**

```bash
cd "D:/NetWork/frontend"
npm install
npm run dev
# 期望: Vite 开发服务器启动在 5173 端口
```

- [ ] **Step 10: 提交**

```bash
cd "D:/NetWork"
git add frontend/
git commit -m "feat: initialize React frontend with Tailwind"
```

---

### Task 3: 实现布局组件 (Layout)

**Files:**
- Create: `frontend/src/components/layout/Layout.jsx`
- Create: `frontend/src/components/layout/Sidebar.jsx`
- Create: `frontend/src/components/layout/Header.jsx`

- [ ] **Step 1: 创建 Layout.jsx**

```jsx
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
```

- [ ] **Step 2: 创建 Layout.css**

```css
.console-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.main {
  padding: 24px;
  background: linear-gradient(180deg, #0a0f1a 0%, #0b1220 100%);
}

@media (max-width: 980px) {
  .console-shell {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 创建 Sidebar.jsx**

```jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Settings } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '控制台' },
  { to: '/api-keys', icon: Key, label: 'API Keys' },
  { to: '/settings', icon: Settings, label: '设置' },
];

function Sidebar() {
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
      </nav>
    </aside>
  );
}

export default Sidebar;
```

- [ ] **Step 4: 创建 Sidebar.css**

```css
.sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(16px);
  padding: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  font-weight: 700;
  font-size: 20px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.sidebar-nav {
  display: grid;
  gap: 8px;
}

.sidebar-link {
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--muted);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.sidebar-link:hover,
.sidebar-link.active {
  background: rgba(139, 92, 246, 0.14);
  color: var(--text);
}
```

- [ ] **Step 5: 创建 Header.jsx**

```jsx
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
```

- [ ] **Step 6: 创建 Header.css**

```css
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title h1 {
  font-size: 28px;
  margin-bottom: 6px;
}

.page-title p {
  color: var(--muted);
  font-size: 14px;
}

.user-chip {
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--muted);
  display: flex;
  align-items: center;
}
```

- [ ] **Step 7: 验证布局**

```bash
cd "D:/NetWork/frontend"
npm run dev
# 访问 http://localhost:5173/dashboard
# 期望: 看到深色侧边栏 + Header + 内容区
```

- [ ] **Step 8: 提交**

```bash
cd "D:/NetWork"
git add frontend/src/components/layout/
git commit -m "feat: implement layout components with NetWork style"
```

---

### Task 4: 实现落地页 (Landing)

**Files:**
- Create: `frontend/src/pages/Landing/index.jsx`
- Create: `frontend/src/pages/Landing/Landing.css`
- Create: `frontend/src/components/common/ParticleBackground.jsx`

- [ ] **Step 1: 创建粒子背景组件**

```jsx
import { useEffect, useRef } from 'react';
import './ParticleBackground.css';

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

export default ParticleBackground;
```

- [ ] **Step 2: 创建 ParticleBackground.css**

```css
.particle-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 3: 创建 Landing 页面**

```jsx
import { Link } from 'react-router-dom';
import ParticleBackground from '../../components/common/ParticleBackground';
import { Button } from '@douyinfe/semi-ui';
import './Landing.css';

const models = [
  { name: 'GPT-4o', provider: 'OpenAI', icon: '🤖' },
  { name: 'Claude 3.5', provider: 'Anthropic', icon: '🧠' },
  { name: 'Gemini Pro', provider: 'Google', icon: '💎' },
  { name: 'DeepSeek V3', provider: 'DeepSeek', icon: '🔥' },
];

function Landing() {
  return (
    <div className="landing">
      <ParticleBackground />

      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="brand-icon">N</span>
          NetWork AI
        </div>
        <div className="nav-links">
          <Link to="/login">
            <Button theme="borderless" style={{ color: '#fff' }}>
              登录
            </Button>
          </Link>
          <Link to="/register">
            <Button className="btn-primary">立即开始</Button>
          </Link>
        </div>
      </nav>

      <section className="hero">
        <h1>
          一站式 <span className="gradient-text">AI 模型</span> 接入平台
        </h1>
        <p>
          兼容 OpenAI 格式，支持 GPT、Claude、Gemini、DeepSeek 等主流模型
        </p>
        <div className="hero-actions">
          <Link to="/register">
            <Button size="large" className="btn-primary">
              免费试用
            </Button>
          </Link>
          <Button
            size="large"
            className="btn-secondary"
            onClick={() =>
              document
                .getElementById('models')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            查看模型
          </Button>
        </div>
      </section>

      <section id="models" className="models-section">
        <h2>支持的模型</h2>
        <div className="models-grid">
          {models.map((m) => (
            <div key={m.name} className="model-card">
              <span className="model-icon">{m.icon}</span>
              <h3>{m.name}</h3>
              <p>{m.provider}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Landing;
```

- [ ] **Step 4: 创建 Landing.css**

```css
.landing {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: rgba(10, 15, 26, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.nav-links {
  display: flex;
  gap: 12px;
}

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 120px 24px 80px;
  position: relative;
  z-index: 1;
}

.hero h1 {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.2;
}

.hero p {
  font-size: 20px;
  color: var(--muted);
  max-width: 600px;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--secondary);
  background: rgba(139, 92, 246, 0.1);
}

.models-section {
  padding: 80px 48px;
  position: relative;
  z-index: 1;
}

.models-section h2 {
  text-align: center;
  font-size: 36px;
  margin-bottom: 48px;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.model-card {
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
}

.model-card:hover {
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-4px);
}

.model-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.model-card h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.model-card p {
  color: var(--muted);
}
```

- [ ] **Step 5: 验证落地页**

```bash
# 访问 http://localhost:5173/
# 期望: 看到粒子背景 + Hero + 模型卡片
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/pages/Landing/
git commit -m "feat: implement landing page with particle background"
```

---

### Task 5: 实现登录/注册页面

**Files:**
- Create: `frontend/src/pages/Auth/Login.jsx`
- Create: `frontend/src/pages/Auth/Register.jsx`
- Create: `frontend/src/services/auth.js`

- [ ] **Step 1: 创建 API 服务**

```js
// frontend/src/services/auth.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const authService = {
  login: (email, password) =>
    api.post('/user/login', { email, password }),

  register: (email, password, name) =>
    api.post('/user/register', { email, password, name }),

  getUserInfo: () =>
    api.get('/user/info'),

  logout: () =>
    api.post('/user/logout'),
};
```

- [ ] **Step 2: 创建 Login 页面**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@douyinfe/semi-ui';
import { authService } from '../../services/auth';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>登录</h1>
        <p>欢迎回来</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="field">
            <label>密码</label>
            <Input
              type="password"
              value={password}
              onChange={(v) => setPassword(v)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            className="btn-primary"
            loading={loading}
            block
          >
            登录
          </Button>
        </form>

        <p className="auth-footer">
          还没有账户？<Link to="/register">立即注册</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
```

- [ ] **Step 3: 创建 Register 页面**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@douyinfe/semi-ui';
import { authService } from '../../services/auth';
import './Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.register(email, password, name);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>注册</h1>
        <p>创建您的账户</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>名称</label>
            <Input
              value={name}
              onChange={(v) => setName(v)}
              placeholder="您的名称"
              required
            />
          </div>

          <div className="field">
            <label>邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="field">
            <label>密码</label>
            <Input
              type="password"
              value={password}
              onChange={(v) => setPassword(v)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            className="btn-primary"
            loading={loading}
            block
          >
            注册
          </Button>
        </form>

        <p className="auth-footer">
          已有账户？<Link to="/login">立即登录</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
```

- [ ] **Step 4: 创建 Auth.css**

```css
.auth-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(
    circle at top left,
    rgba(59, 130, 246, 0.18),
    transparent 28%
  ),
  radial-gradient(
    circle at top right,
    rgba(139, 92, 246, 0.16),
    transparent 26%
  ),
  linear-gradient(180deg, #0a0f1a 0%, #0b1220 100%);
}

.auth-card {
  width: min(100%, 440px);
  padding: 40px;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.auth-card h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.auth-card > p {
  color: var(--muted);
  margin-bottom: 32px;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 14px;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.auth-footer a {
  color: var(--secondary);
  font-weight: 600;
}
```

- [ ] **Step 5: 验证登录/注册页面**

```bash
# 访问 http://localhost:5173/login 和 /register
# 期望: 看到深色登录/注册卡片
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/pages/Auth/ frontend/src/services/auth.js
git commit -m "feat: implement login and register pages"
```

---

### Task 6: 实现控制台页面 (Dashboard)

**Files:**
- Create: `frontend/src/pages/Dashboard/index.jsx`
- Create: `frontend/src/services/api.js`

- [ ] **Step 1: 创建 API 服务**

```js
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  getUserInfo: () => api.get('/user/info'),
  getTokens: () => api.get('/token'),
  createToken: (name, modelLimits) =>
    api.post('/token', { name, modelLimits }),
  deleteToken: (id) => api.delete(`/token/${id}`),
  getUsage: (start, end) =>
    api.get('/usage', { params: { start, end } }),
};
```

- [ ] **Step 2: 创建 Dashboard 页面**

```jsx
import { useState, useEffect } from 'react';
import { Card } from '@douyinfe/semi-ui';
import { apiService } from '../../services/api';
import { Coins, Zap, Key, TrendingUp } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await apiService.getUserInfo();
      setUserInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  const quota = userInfo?.quota || 0;
  const usedQuota = userInfo?.usedQuota || 0;
  const remainQuota = quota - usedQuota;

  return (
    <div className="dashboard">
      <div className="grid-4">
        <Card className="metric-card">
          <div className="metric-icon">
            <Coins size={24} />
          </div>
          <div className="metric-label">账户余额</div>
          <div className="metric-value">{quota.toLocaleString()}</div>
          <div className="metric-sub">约 ${(quota / 1000000).toFixed(2)}</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon">
            <Zap size={24} />
          </div>
          <div className="metric-label">剩余额度</div>
          <div className="metric-value gradient-text">
            {remainQuota.toLocaleString()}
          </div>
          <div className="metric-sub">可用额度</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon">
            <Key size={24} />
          </div>
          <div className="metric-label">API Keys</div>
          <div className="metric-value">{userInfo?.tokenCount || 0}</div>
          <div className="metric-sub">活跃密钥</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-label">本月用量</div>
          <div className="metric-value">{usedQuota.toLocaleString()}</div>
          <div className="metric-sub">Token 消耗</div>
        </Card>
      </div>

      <div className="content-grid">
        <Card className="panel">
          <h2>快速开始</h2>
          <div className="quick-start">
            <p>使用以下端点接入 AI 模型：</p>
            <code className="code-block">
              curl https://api.network.ai/v1/chat/completions \<br />
              -H "Authorization: Bearer YOUR_API_KEY" \<br />
              -H "Content-Type: application/json" \<br />
              -d '{"model": "gpt-4o", "messages": [...]'
            </code>
          </div>
        </Card>

        <Card className="panel">
          <h2>可用模型</h2>
          <ul className="model-list">
            <li><span className="tag">GPT-4o</span> OpenAI</li>
            <li><span className="tag">Claude 3.5</span> Anthropic</li>
            <li><span className="tag">Gemini Pro</span> Google</li>
            <li><span className="tag">DeepSeek V3</span> DeepSeek</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
```

- [ ] **Step 3: 创建 Dashboard.css**

```css
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.metric-card {
  padding: 24px;
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.metric-label {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 800;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.metric-sub {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 18px;
}

.panel {
  padding: 24px;
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
}

.panel h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.quick-start p {
  color: var(--muted);
  margin-bottom: 12px;
}

.code-block {
  display: block;
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #93c5fd;
  overflow-x: auto;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-list li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.14);
  color: #93c5fd;
  font-size: 12px;
}

@media (max-width: 980px) {
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: 验证控制台页面**

```bash
# 登录后访问 http://localhost:5173/dashboard
# 期望: 看到统计卡片 + 快速开始 + 模型列表
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/Dashboard/ frontend/src/services/api.js
git commit -m "feat: implement dashboard with metrics cards"
```

---

### Task 7: 实现 API Key 管理页面

**Files:**
- Create: `frontend/src/pages/APIKeys/index.jsx`
- Modify: `frontend/src/pages/Dashboard/index.jsx` (Header 动态标题)

- [ ] **Step 1: 创建 APIKeys 页面**

```jsx
import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@douyinfe/semi-ui';
import { Plus, Copy, Trash2, Check } from 'lucide-react';
import { apiService } from '../../services/api';
import './APIKeys.css';

function APIKeys() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data } = await apiService.getTokens();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const { data } = await apiService.createToken(newKeyName);
      setTokens([data, ...tokens]);
      setNewKeyName('');
    } catch (err) {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个 API Key 吗？')) return;
    try {
      await apiService.deleteToken(id);
      setTokens(tokens.filter((t) => t.id !== id));
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleCopy = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="api-keys">
      <Card className="create-card">
        <h2>创建新的 API Key</h2>
        <div className="create-form">
          <Input
            placeholder="Key 名称（如：开发环境）"
            value={newKeyName}
            onChange={setNewKeyName}
            style={{ flex: 1 }}
          />
          <Button
            className="btn-primary"
            icon={<Plus size={16} />}
            onClick={handleCreate}
            loading={creating}
          >
            创建
          </Button>
        </div>
      </Card>

      <div className="key-list">
        {loading ? (
          <div>加载中...</div>
        ) : tokens.length === 0 ? (
          <Card className="empty-card">
            <p>还没有 API Key，点击上方按钮创建一个</p>
          </Card>
        ) : (
          tokens.map((token) => (
            <Card key={token.id} className="key-card">
              <div className="key-info">
                <h3>{token.name}</h3>
                <code className="key-value">
                  {token.key.slice(0, 8)}...{token.key.slice(-4)}
                </code>
              </div>
              <div className="key-actions">
                <Button
                  size="small"
                  theme="borderless"
                  icon={
                    copiedId === token.id ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )
                  }
                  onClick={() => handleCopy(token.key, token.id)}
                />
                <Button
                  size="small"
                  theme="borderless"
                  type="danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDelete(token.id)}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default APIKeys;
```

- [ ] **Step 2: 创建 APIKeys.css**

```css
.api-keys {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.create-card,
.key-card,
.empty-card {
  padding: 24px;
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
}

.create-card h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.create-form {
  display: flex;
  gap: 12px;
}

.key-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.key-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.key-info h3 {
  font-size: 16px;
  margin-bottom: 6px;
}

.key-value {
  font-size: 13px;
  color: var(--muted);
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 6px;
}

.key-actions {
  display: flex;
  gap: 8px;
}

.empty-card {
  text-align: center;
  color: var(--muted);
  padding: 48px;
}
```

- [ ] **Step 3: 更新 Header 动态标题**

```jsx
// 修改 Header.jsx，根据路由显示不同标题
import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard': { title: '控制台', desc: '管理您的 AI API 访问' },
  '/api-keys': { title: 'API Keys', desc: '创建和管理您的 API 密钥' },
  '/settings': { title: '设置', desc: '账户和偏好设置' },
};

function Header() {
  const location = useLocation();
  const { title, desc } = titles[location.pathname] || titles['/dashboard'];

  return (
    <header className="topbar">
      <div className="page-title">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {/* ... */}
    </header>
  );
}
```

- [ ] **Step 4: 验证 API Key 页面**

```bash
# 访问 http://localhost:5173/api-keys
# 期望: 看到创建表单 + Key 列表
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/APIKeys/
git commit -m "feat: implement API key management page"
```

---

### Task 8: 实现国际化 (i18n)

**Files:**
- Create: `frontend/src/i18n/index.js`
- Create: `frontend/src/i18n/locales/zh.json`
- Create: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: 创建 i18n 配置**

```js
// frontend/src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zh from './locales/zh.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

- [ ] **Step 2: 创建中文语言包**

```json
{
  "nav": {
    "dashboard": "控制台",
    "apiKeys": "API Keys",
    "settings": "设置"
  },
  "dashboard": {
    "balance": "账户余额",
    "remain": "剩余额度",
    "activeKeys": "活跃密钥",
    "monthlyUsage": "本月用量",
    "quickStart": "快速开始"
  },
  "auth": {
    "login": "登录",
    "register": "注册",
    "email": "邮箱",
    "password": "密码",
    "name": "名称"
  }
}
```

- [ ] **Step 3: 创建英文语言包**

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "apiKeys": "API Keys",
    "settings": "Settings"
  },
  "dashboard": {
    "balance": "Balance",
    "remain": "Remain",
    "activeKeys": "Active Keys",
    "monthlyUsage": "Monthly Usage",
    "quickStart": "Quick Start"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "email": "Email",
    "password": "Password",
    "name": "Name"
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/i18n/
git commit -m "feat: add i18n support with zh/en locales"
```

---

### Task 9: 配置 Docker 部署

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/init.sh`

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./new-api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - AppID=network-ai
      - AppKey=${APP_KEY}
      - MasterKey=${MASTER_KEY}
      - SQL_DSN=/data/new-api.db
      - REDIS_CONN_STRING=redis:6379
      - SessionSecret=${SESSION_SECRET}
      - CRYPTO_SECRET=${CRYPTO_SECRET}
      - InitialQuota=1000000
    volumes:
      - ./data:/data
    depends_on:
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

- [ ] **Step 2: 创建前端 Dockerfile**

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: 创建 nginx.conf**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3000/api/;
    }

    location /v1/ {
        proxy_pass http://backend:3000/v1/;
    }
}
```

- [ ] **Step 4: 创建环境变量模板**

```bash
# docker/.env.example
APP_KEY=change-me-in-production
MASTER_KEY=change-me-in-production
SESSION_SECRET=change-me-in-production
CRYPTO_SECRET=change-me-in-production
```

- [ ] **Step 5: 提交**

```bash
git add docker/
git commit -m "feat: add Docker deployment configuration"
```

---

## 自检清单

1. **Spec 覆盖**: 检查设计规范中的每个功能是否都有对应任务
2. **占位符扫描**: 确认无 "TBD"、"TODO"、"后续实现" 等占位符
3. **类型一致性**: 确认组件名称、API 端点、变量名一致

---

## 执行选项

**计划已完成并保存到 `docs/superpowers/plans/2026-04-17-new-api-refactor-implementation.md`**

两种执行方式：

**1. 子代理驱动（推荐）** - 我为每个任务启动一个子代理，任务间进行审查，快速迭代

**2. 批量执行** - 在本会话中按批次执行任务，带检查点

选择哪种方式？