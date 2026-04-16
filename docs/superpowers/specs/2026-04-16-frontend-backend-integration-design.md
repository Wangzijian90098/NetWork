# 前端对接后端 — 设计文档

> **作者：** Diamond-Wzj
> **日期：** 2026-04-16
> **阶段：** 第四阶段

---

## 一、项目概述

**目标：** 将前端（landing.html / login.html / dashboard.html / api-keys.html）从 localStorage 模拟数据迁移至真实后端 API，统一使用 HttpOnly Cookie 进行身份认证，部署架构为 Nginx + Flask 同域方案。

**技术栈：**
- 前端：HTML5 + CSS3 + Vanilla JavaScript
- 后端：Python Flask（已有）
- 认证：HttpOnly Cookie + JWT
- 部署：Nginx 反向代理，Flask 提供 API + 前端静态文件

---

## 二、系统架构

```
用户浏览器
    ↓
Nginx（端口 80/443）
    ├── 静态文件  → /var/www/aihubs/dist/     （前端 HTML/CSS/JS）
    ├── /api/*   → 反向代理 → Flask :8080    （后端 API）
    └── /v1/*    → 反向代理 → Flask :8080    （Chat 代理）
    ↓
Flask（端口 8080）
    ├── API 接口（登录成功设置 HttpOnly Cookie）
    ├── Chat 代理（从 Cookie 读取 JWT）
    └── 静态文件（开发环境由 Flask 直接托管）
```

**Cookie 认证流程：**

```
登录 POST /api/auth/login
    ↓
后端验证密码，签发 JWT，写入 HttpOnly Cookie
    ↓
响应 Header: Set-Cookie: token=<jwt>; HttpOnly; Path=/; SameSite=Lax
    ↓
后续请求浏览器自动携带 Cookie（JS 无法读取，防 XSS）
```

---

## 三、数据库设计（无变更）

沿用第三阶段设计的数据库结构，无需改动。

---

## 四、后端改动

### 4.1 Cookie 认证支持

**修改文件：** `backend/routes/auth_routes.py`

新增登录时设置 Cookie，logout 时清除 Cookie：

```python
from flask import make_response

@auth_bp.route("/login", methods=["POST"])
def login():
    # ... 现有验证逻辑 ...
    if success:
        response = make_response(jsonify({"success": True, "data": user_data}))
        # 设置 HttpOnly Cookie
        response.set_cookie(
            "token",
            token,
            httponly=True,
            samesite="Lax",
            path="/",
            max_age=7 * 24 * 3600  # 7 天
        )
        return response
    return jsonify({"success": False, "message": error}), 401

@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"success": True, "message": "已退出登录"}))
    response.delete_cookie("token", path="/")
    return response
```

### 4.2 Cookie 读取中间件

**修改文件：** `backend/routes/key_routes.py`、`backend/routes/usage_routes.py`、`backend/routes/chat_routes.py`

将 `extract_token_from_header` 替换为从 Cookie 读取 Token（Chat 代理接口保持 Authorization Header 兼容 OpenAI SDK）：

```python
def get_token_from_request(request):
    """优先从 Cookie 读取 Token，fallback 到 Authorization Header"""
    token = request.cookies.get("token")
    if token:
        return token
    # OpenAI SDK 兼容
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None
```

### 4.3 后端静态文件托管（开发环境）

**修改文件：** `backend/ai_hub_backend.py`

```python
from flask import send_from_directory
import os

# 开发环境：Flask 直接托管前端静态文件
@app.route("/")
def serve_frontend():
    return send_from_directory(os.path.dirname(__file__), "index.html")

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(os.path.dirname(__file__), filename)
```

---

## 五、前端改动

### 5.1 文件结构

```
assets/
├── console.css        # 样式（不变）
├── console.js        # 移除模拟数据逻辑
└── api.js            # 新增：统一 API 调用层
```

### 5.2 API 调用层 — `assets/api.js`

| 函数 | 对应后端接口 | 说明 |
|------|------------|------|
| `authLogin(email, password)` | POST /api/auth/login | 登录，返回 user 数据 |
| `authRegister(email, password)` | POST /api/auth/register | 注册 |
| `authLogout()` | POST /api/auth/logout | 退出登录，清除 Cookie |
| `getKeys()` | GET /api/keys | 获取 Key 列表 |
| `createKey(name)` | POST /api/keys | 创建 Key |
| `revokeKey(id)` | DELETE /api/keys/{id} | 撤销 Key |
| `getUsage(days)` | GET /v1/account/usage | 用量统计 |
| `getModels()` | GET /v1/models | 可用模型列表 |

**实现示例：**

```javascript
const BASE = '';  // 同域，Nginx 代理到后端

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    credentials: 'include',  // 携带 Cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (response.status === 401) {
    // 未登录，跳转登录页
    window.location.href = './login.html';
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error?.message || '请求失败');
  }
  return data;
}

async function authLogin(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;  // Cookie 由后端设置，浏览器自动存储
}

async function authLogout() {
  await request('/api/auth/logout', { method: 'POST' });
}

async function getKeys() {
  const data = await request('/api/keys');
  return data.data;
}

async function createKey(name) {
  const data = await request('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.data;
}

async function revokeKey(id) {
  const data = await request(`/api/keys/${id}`, { method: 'DELETE' });
  return data;
}

async function getUsage(days = 30) {
  const data = await request(`/v1/account/usage?days=${days}`);
  return data.data;
}
```

### 5.3 登录页改造 — `login.html`

移除 localStorage 逻辑，改为调用 `api.js`：

```javascript
// 移除 getDemoUser / setDemoUser / ensureDemoKeys
// 改为：

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    await authLogin(email, password);
    window.location.href = './dashboard.html';
  } catch (err) {
    alert('登录失败：' + err.message);
  }
});
```

### 5.4 控制台概览改造 — `dashboard.html`

将 `getBalance()` / `getUsage()` 替换为真实 API 调用。

### 5.5 API Key 管理改造 — `api-keys.html`

将 `getKeys()` / `createKey()` / `revokeKey()` 替换为 `api.js` 中的真实 API。

---

## 六、错误处理

| HTTP 状态码 | 前端处理 |
|------------|---------|
| 200 | 成功，显示数据 |
| 400 | 参数错误，显示后端返回的消息 |
| 401 | 未登录 / Token 过期，自动跳转 login.html |
| 402 | 余额不足，显示余额不足提示 |
| 422 | 模型不支持，显示提示 |
| 429 | 请求过于频繁，显示限流提示 |
| 500/502/503 | 显示服务器错误提示 |

---

## 七、Nginx 配置

```nginx
server {
    listen 80;
    server_name aihubs.com;  # 替换为真实域名

    root /var/www/aihubs/dist;  # 前端静态文件目录
    index landing.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /landing.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_pass_header Set-Cookie;  # 透传 Cookie
    }

    # Chat 代理（OpenAI 兼容）
    location /v1/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_pass_header Set-Cookie;
    }
}
```

---

## 八、开发阶段本地运行

```bash
# 后端（开发模式，Flask 直接托管前端）
cd D:\NetWork/backend
python ai_hub_backend.py
# 访问 http://localhost:8080/

# 生产模式（Nginx + Flask）
# 见 Nginx 配置章节
```

---

## 九、迁移检查清单

- [ ] 后端：auth_routes.py 添加 Cookie 设置与清除
- [ ] 后端：get_token_from_request 中间件（Cookie 优先）
- [ ] 后端：Flask 静态文件托管（开发环境）
- [ ] 前端：新建 assets/api.js
- [ ] 前端：login.html 移除 localStorage，对接 authLogin
- [ ] 前端：dashboard.html 对接 getUsage / getBalance
- [ ] 前端：api-keys.html 对接 getKeys / createKey / revokeKey
- [ ] 前端：assets/console.js 清理废弃的模拟数据函数
- [ ] 测试：登录流程 Cookie 正确设置与携带
- [ ] 测试：401 自动跳转登录页
- [ ] 部署：Nginx 配置（含 Cookie 透传）
