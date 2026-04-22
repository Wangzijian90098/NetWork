# 前后端对接实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 React 前端与 Java Spring Boot 后端的对接，实现 JWT + HTTPOnly Cookie 认证

**Architecture:** 后端 Spring Security 使用 JWT Filter 验证 Cookie，前端 React 通过 Vite Proxy 访问后端 API，使用 Context 管理认证状态

**Tech Stack:** React 18 + Vite + Tailwind CSS, Spring Boot 3.2 + Spring Security 6 + JWT

---

## 文件结构

```
frontend/src/
├── contexts/AuthContext.jsx          # 新建：认证状态管理
├── services/api.js                   # 修改：与后端 API 对齐
├── services/auth.js                 # 修改：与后端 API 对齐
├── hooks/useAuth.js                 # 新建：认证 Hook
└── pages/Auth/Login.jsx             # 修改：对接后端
    pages/Auth/Register.jsx          # 修改：对接后端
    Dashboard/index.jsx             # 修改：对接统计 API

java-backend/
├── src/main/java/com/aihub/config/
│   └── CorsConfig.java             # 新建：CORS 配置
├── Dockerfile                      # 新建：Java 后端镜像
└── docker-compose.yml              # 新建：部署配置
```

---

## Phase 1: 后端调整

### Task 1: 添加 CORS 配置

**Files:**
- Create: `java-backend/src/main/java/com/aihub/config/CorsConfig.java`

- [ ] **Step 1: 创建 CORS 配置类**

```java
package com.aihub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

- [ ] **Step 2: 更新 SecurityConfig 启用 CORS**

Modify: `java-backend/src/main/java/com/aihub/config/SecurityConfig.java:24`

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        // ... rest of config
```

- [ ] **Step 3: 提交**

```bash
git add java-backend/src/main/java/com/aihub/config/
git commit -m "feat: add CORS configuration for frontend integration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 统一 API 响应格式

**Files:**
- Create: `java-backend/src/main/java/com/aihub/dto/response/ApiResponse.java`

- [ ] **Step 1: 检查现有 ApiResponse 类**

Run: `find /d/NetWork/java-backend -name "ApiResponse.java"`

- [ ] **Step 2: 如不存在或格式不对，创建/修改**

```java
package com.aihub.dto.response;

public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public ApiResponse() {}

    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    // Getters and setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
```

- [ ] **Step 3: 提交**

```bash
git add java-backend/src/main/java/com/aihub/dto/response/ApiResponse.java
git commit -m "feat: add ApiResponse DTO for consistent API responses

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2: 前端对接

### Task 3: 创建 AuthContext

**Files:**
- Create: `frontend/src/contexts/AuthContext.jsx`
- Create: `frontend/src/hooks/useAuth.js`

- [ ] **Step 1: 创建 AuthContext**

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await authService.getCurrentUser();
      if (data.success) {
        setUser(data.data);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await authService.login(email, password);
    if (data.success) {
      await checkAuth();
    }
    return data;
  };

  const register = async (email, password) => {
    const { data } = await authService.register(email, password);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

- [ ] **Step 2: 创建 useAuth Hook**

```jsx
export { useAuth } from '../contexts/AuthContext';
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/contexts/AuthContext.jsx frontend/src/hooks/useAuth.js
git commit -m "feat: add AuthContext for authentication state management

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 修正 Auth Service API 路径

**Files:**
- Modify: `frontend/src/services/auth.js`

- [ ] **Step 1: 修正 API 路径为后端格式**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password }),

  getCurrentUser: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/services/auth.js
git commit -m "fix: align auth service with backend API paths

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 完善登录页面

**Files:**
- Modify: `frontend/src/pages/Auth/Login.jsx`

- [ ] **Step 1: 更新登录页面对接 AuthContext**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@douyinfe/semi-ui';
import { useAuth } from '../../hooks/useAuth';
import '../Auth/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || '登录失败');
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
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="your@email.com"
              type="email"
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

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Auth/Login.jsx
git commit -m "feat: update Login page with AuthContext integration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 完善注册页面

**Files:**
- Modify: `frontend/src/pages/Auth/Register.jsx`

- [ ] **Step 1: 更新注册页面**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@douyinfe/semi-ui';
import { useAuth } from '../../hooks/useAuth';
import '../Auth/Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      const result = await register(email, password);
      if (result.success) {
        alert('注册成功，请登录');
        navigate('/login');
      }
    } catch (err) {
      alert(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>注册</h1>
        <p>创建新账户</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>邮箱</label>
            <Input
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="your@email.com"
              type="email"
              required
            />
          </div>

          <div className="field">
            <label>密码</label>
            <Input
              type="password"
              value={password}
              onChange={(v) => setPassword(v)}
              placeholder="至少 6 位"
              required
            />
          </div>

          <div className="field">
            <label>确认密码</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(v) => setConfirmPassword(v)}
              placeholder="再次输入密码"
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

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Auth/Register.jsx
git commit -m "feat: update Register page with form validation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 创建 API Service

**Files:**
- Create: `frontend/src/services/api.js`

- [ ] **Step 1: 创建 API Service 对接后端**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const apiService = {
  // 获取使用统计
  getUsageStats: () => api.get('/usage/stats'),

  // 获取趋势数据
  getUsageTrend: (days = 7) => api.get('/usage/trend', { params: { days } }),

  // 获取模型分布
  getModelDistribution: () => api.get('/usage/models'),

  // 获取所有 API Keys
  getKeys: () => api.get('/keys'),

  // 创建 API Key
  createKey: (name) => api.post('/keys', { name }),

  // 删除 API Key
  deleteKey: (id) => api.delete(`/keys/${id}`),

  // 启用/禁用 Key
  toggleKey: (id) => api.patch(`/keys/${id}/toggle`),
};
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/services/api.js
git commit -m "feat: add API service for backend integration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 对接 Dashboard 页面

**Files:**
- Modify: `frontend/src/pages/Dashboard/index.jsx`

- [ ] **Step 1: 更新 Dashboard 使用 API Service**

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, trendRes, modelsRes] = await Promise.all([
        apiService.getUsageStats(),
        apiService.getUsageTrend(7),
        apiService.getModelDistribution(),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (trendRes.data.success) setTrend(trendRes.data.data || []);
      if (modelsRes.data.success) setModels(modelsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">加载中...</div>;
  }

  return (
    <div className="dashboard">
      <h1>欢迎, {user?.email}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>总请求数</h3>
          <p className="stat-value">{stats?.totalRequests || 0}</p>
        </div>
        <div className="stat-card">
          <h3>总 Token 消耗</h3>
          <p className="stat-value">{stats?.totalTokens || 0}</p>
        </div>
        <div className="stat-card">
          <h3>活跃 Key</h3>
          <p className="stat-value">{stats?.activeKeys || 0}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>使用趋势</h2>
        {trend.length > 0 ? (
          <div className="trend-chart">
            {trend.map((item, idx) => (
              <div key={idx} className="trend-item">
                <span>{item.date}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>暂无数据</p>
        )}
      </div>

      <div className="dashboard-section">
        <h2>模型分布</h2>
        {models.length > 0 ? (
          <div className="model-list">
            {models.map((item, idx) => (
              <div key={idx} className="model-item">
                <span>{item.model}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>暂无数据</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Dashboard/index.jsx
git commit -m "feat: integrate Dashboard with backend API

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3: Docker 部署

### Task 9: 创建 Java 后端 Dockerfile

**Files:**
- Create: `java-backend/Dockerfile`

- [ ] **Step 1: 创建多阶段构建 Dockerfile**

```dockerfile
# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY .mvn .mvn
COPY mvnw .
COPY pom.xml .

# Download dependencies
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN ./mvnw package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy jar file
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: 提交**

```bash
git add java-backend/Dockerfile
git commit -m "feat: add Dockerfile for Java backend

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: 创建 Docker Compose 配置

**Files:**
- Create: `java-backend/docker-compose.yml`

- [ ] **Step 1: 创建 Docker Compose**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: aihub-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: aihub
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - aihub-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: aihub-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/aihub?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
      SERVER_PORT: 8080
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - aihub-network

volumes:
  mysql_data:

networks:
  aihub-network:
    driver: bridge
```

- [ ] **Step 2: 创建 .env.dockerignore**

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=aihub

# Application
SERVER_PORT=8080
```

- [ ] **Step 3: 提交**

```bash
git add java-backend/docker-compose.yml java-backend/.env.dockerignore
git commit -m "feat: add Docker Compose for local deployment

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: 配置 Vite Proxy

**Files:**
- Modify: `frontend/vite.config.js`

- [ ] **Step 1: 检查现有 vite.config.js**

Run: `cat /d/NetWork/frontend/vite.config.js`

- [ ] **Step 2: 更新 Vite 配置**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: 提交**

```bash
git add frontend/vite.config.js
git commit -m "feat: configure Vite proxy for backend API

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4: Workers 同步

### Task 12: 添加 Workers 同步接口

**Files:**
- Modify: `java-backend/src/main/java/com/aihub/controller/AdminController.java`

- [ ] **Step 1: 检查现有 AdminController**

Run: `cat /d/NetWork/java-backend/src/main/java/com/aihub/controller/AdminController.java`

- [ ] **Step 2: 添加同步端点**

在 AdminController 中添加：

```java
@GetMapping("/sync")
public ResponseEntity<ApiResponse<Map<String, Object>>> syncToWorkers() {
    List<Key> keys = keyService.getAllActiveKeys();
    List<Map<String, Object>> keyData = keys.stream()
        .map(k -> Map.<String, Object>of(
            "key", k.getKeyValue(),
            "name", k.getName(),
            "enabled", k.isEnabled()
        ))
        .collect(Collectors.toList());

    return ResponseEntity.ok(ApiResponse.success("同步成功", Map.of("keys", keyData)));
}
```

- [ ] **Step 3: 提交**

```bash
git add java-backend/src/main/java/com/aihub/controller/AdminController.java
git commit -m "feat: add sync endpoint for Workers API keys

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## 验收清单

- [ ] Task 1: CORS 配置创建完成
- [ ] Task 2: API 响应格式统一
- [ ] Task 3: AuthContext 创建完成
- [ ] Task 4: Auth Service 路径修正
- [ ] Task 5: 登录页面对接完成
- [ ] Task 6: 注册页面对接完成
- [ ] Task 7: API Service 创建完成
- [ ] Task 8: Dashboard 数据对接完成
- [ ] Task 9: Java Dockerfile 创建完成
- [ ] Task 10: Docker Compose 配置完成
- [ ] Task 11: Vite Proxy 配置完成
- [ ] Task 12: Workers 同步接口完成

---

## 运行测试命令

**后端测试：**
```bash
cd /d/NetWork/java-backend
./mvnw spring-boot:run
```

**前端测试：**
```bash
cd /d/NetWork/frontend
npm run dev
```

**Docker 部署：**
```bash
cd /d/NetWork/java-backend
docker-compose up -d
```
