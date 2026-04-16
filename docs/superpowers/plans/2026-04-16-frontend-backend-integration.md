# Frontend-Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端（login.html / dashboard.html / api-keys.html）的 localStorage 模拟数据迁移至真实后端 API，统一使用 HttpOnly Cookie 进行身份认证。

**Architecture:** 新建统一 API 层（assets/api.js），后端增加 Cookie 认证支持，Flask 开发环境直接托管前端静态文件。前端通过 Nginx 反向代理与后端同域，Cookie 自动跨请求携带。

**Tech Stack:** HTML5 + Vanilla JS（前端），Python Flask（后端），HttpOnly Cookie + JWT（认证）

---

## 文件结构

```
assets/
├── console.js    # 清理模拟数据函数，保留 UI 工具函数（logout/maskToken）
└── api.js        # 新增：统一 API 调用层

backend/
├── ai_hub_backend.py    # 修改：Flask 静态文件托管（开发环境）
└── routes/
    ├── auth_routes.py    # 修改：Cookie 设置与清除
    ├── key_routes.py     # 修改：Cookie 读取
    └── usage_routes.py   # 修改：Cookie 读取

login.html           # 修改：对接 authLogin
dashboard.html        # 修改：对接 getUsage / 活跃 Key 统计
api-keys.html         # 修改：对接 getKeys / createKey / revokeKey
```

---

## Task 1: 后端 Cookie 认证支持 — auth_routes.py

**Files:**
- Modify: `backend/routes/auth_routes.py`

- [ ] **Step 1: 修改登录接口，添加 HttpOnly Cookie 设置**

将 `backend/routes/auth_routes.py` 中的 `login()` 函数替换为以下完整代码：

```python
"""认证路由"""
from flask import Blueprint, request, jsonify, make_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    success, message = __import__("services.auth_service", fromlist=["register"]).register(email, password)
    return jsonify({"success": success, "message": message}), 200 if success else 400


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    success, user_data, error = __import__("services.auth_service", fromlist=["login"]).login(email, password)
    if success:
        token = user_data["token"]
        user_info = user_data["user"]
        response = make_response(jsonify({
            "success": True,
            "data": {"user": user_info}
        }))
        response.set_cookie(
            "token",
            token,
            httponly=True,
            samesite="Lax",
            path="/",
            max_age=7 * 24 * 3600
        )
        return response
    return jsonify({"success": False, "message": error}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"success": True, "message": "已退出登录"}))
    response.delete_cookie("token", path="/")
    return response
```

- [ ] **Step 2: 验证语法**

```bash
python -m py_compile backend/routes/auth_routes.py && echo "OK"
```

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/routes/auth_routes.py && git commit -m "feat(backend): add HttpOnly Cookie auth - login sets cookie, logout clears"
```

---

## Task 2: Cookie 读取中间件 + 用量路由改造

**Files:**
- Modify: `backend/routes/key_routes.py`
- Modify: `backend/routes/usage_routes.py`

- [ ] **Step 1: 修改 key_routes.py，添加 Cookie 读取**

将 `backend/routes/key_routes.py` 顶部的 `require_auth()` 函数替换为：

```python
"""API Key 管理路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_token

key_bp = Blueprint("keys", __name__, url_prefix="/api/keys")


def get_token(request):
    """优先从 Cookie 读取 Token，fallback 到 Authorization Header（OpenAI SDK 兼容）"""
    token = request.cookies.get("token")
    if token:
        return token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def require_auth():
    """验证 JWT Token，返回 user_id"""
    token = get_token(request)
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    return payload["user_id"], None, None
```

> 注意：文件其余部分（`list_keys` / `create_key` / `revoke_key` 函数）保持不变，不要修改。

- [ ] **Step 2: 修改 usage_routes.py，添加 Cookie 读取**

将 `backend/routes/usage_routes.py` 顶部的 `require_auth()` 函数替换为：

```python
"""用量查询路由"""
from flask import Blueprint, jsonify, request
from utils.jwt_util import verify_token

usage_bp = Blueprint("usage", __name__, url_prefix="/v1")


def get_token(req):
    """优先从 Cookie 读取 Token，fallback 到 Authorization Header"""
    token = req.cookies.get("token")
    if token:
        return token
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def require_auth():
    """验证 JWT Token，返回 user_id"""
    token = get_token(request)
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    return payload["user_id"], None, None
```

- [ ] **Step 3: 验证语法**

```bash
python -m py_compile backend/routes/key_routes.py backend/routes/usage_routes.py && echo "OK"
```

- [ ] **Step 4: Commit**

```bash
cd D:/NetWork && git add backend/routes/key_routes.py backend/routes/usage_routes.py && git commit -m "feat(backend): support Cookie auth - read from cookie first, fallback to Bearer header"
```

---

## Task 3: Flask 开发环境静态文件托管

**Files:**
- Modify: `backend/ai_hub_backend.py`

- [ ] **Step 1: 添加静态文件托管路由**

在 `backend/ai_hub_backend.py` 的 `register_blueprints()` 调用之前添加以下两个路由函数：

```python
from flask import send_from_directory
import os


@app.route("/")
def serve_root():
    """开发环境：Flask 直接托管前端入口"""
    return send_from_directory(os.path.dirname(__file__), "landing.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """开发环境：Flask 托管前端静态资源（HTML/CSS/JS）"""
    # 防止目录遍历
    filename = os.path.basename(filename)
    return send_from_directory(os.path.dirname(__file__), filename)
```

> **注意：** 将这两个函数插入到 `app = Flask(__name__)` 和 `register_blueprints()` 调用之间。确保 `from flask import send_from_directory` 已在文件顶部导入。

- [ ] **Step 2: 验证语法**

```bash
python -m py_compile backend/ai_hub_backend.py && echo "OK"
```

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/ai_hub_backend.py && git commit -m "feat(backend): serve frontend static files in dev mode via Flask"
```

---

## Task 4: 新建前端统一 API 层 — assets/api.js

**Files:**
- Create: `assets/api.js`

- [ ] **Step 1: 创建 assets/api.js（复制以下完整代码）**

```javascript
/**
 * 统一 API 调用层
 * 使用 HttpOnly Cookie 进行身份认证（credentials: 'include'）
 */

const BASE = '';  // 同域，Nginx 代理到后端

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    credentials: 'include',  // 携带 Cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.location.href = './login.html';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const msg = data.message || data.error?.message || `请求失败 (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

// ---- 认证 ----

async function authLogin(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function authRegister(email, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function authLogout() {
  return request('/api/auth/logout', { method: 'POST' });
}

// ---- API Key 管理 ----

async function getKeys() {
  const data = await request('/api/keys');
  return data.data || [];
}

async function createKey(name) {
  const data = await request('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.data;
}

async function revokeKey(keyId) {
  return request(`/api/keys/${keyId}`, { method: 'DELETE' });
}

// ---- 用量统计 ----

async function getUsage(days = 30) {
  const data = await request(`/v1/account/usage?days=${days}`);
  return data.data || {};
}

async function getModels() {
  const data = await request('/v1/models');
  return data.data || [];
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add assets/api.js && git commit -m "feat(frontend): add unified API layer with Cookie auth"
```

---

## Task 5: 登录页改造 — login.html

**Files:**
- Modify: `login.html`

- [ ] **Step 1: 替换 script 块**

将 `login.html` 底部的 `<script>` 块（包含 `getDemoUser` / `setDemoUser` / `ensureDemoKeys` 的部分）替换为：

```javascript
  <script src="./assets/api.js"></script>
  <script>
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
  </script>
```

> 注意：移除顶部的 `getDemoUser` 检查和 `ensureDemoKeys` 调用（这两个函数不再需要）。

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add login.html && git commit -m "feat(frontend): login page - replace localStorage demo with real API auth"
```

---

## Task 6: 控制台概览改造 — dashboard.html

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: 替换 script 块**

将 `dashboard.html` 底部 `<script src="./assets/console.js">` 后的内联 script 块替换为：

```javascript
  <script src="./assets/api.js"></script>
  <script>
    (async function() {
      try {
        // 获取用量统计
        const usage = await getUsage(30);
        const summary = usage.summary || {};

        // 填充账户余额
        const balanceEl = document.querySelector('.metric-value');
        if (balanceEl && summary.total_cost !== undefined) {
          // 余额 = 初始金额 - 已消耗
          const initial = 10.0;  // 新用户初始 $10
          const remaining = (initial - parseFloat(summary.total_cost)).toFixed(2);
          balanceEl.textContent = '$' + remaining;
        }

        // 填充活跃 Key 数量
        const keys = await getKeys();
        const activeCount = keys.filter(k => k.status === 'active').length;
        const activeEl = document.getElementById('activeKeyCount');
        if (activeEl) activeEl.textContent = String(activeCount);

      } catch (err) {
        // 401 会自动跳转 login.html，其他错误静默降级为静态展示
        console.warn('获取数据失败:', err.message);
      }
    })();
  </script>
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add dashboard.html && git commit -m "feat(frontend): dashboard - fetch real usage stats and key count via API"
```

---

## Task 7: API Key 管理页改造 — api-keys.html

**Files:**
- Modify: `api-keys.html`

- [ ] **Step 1: 替换 script 块**

将 `api-keys.html` 底部 `<script src="./assets/console.js">` 后的内联 script 块（`requireAuth()` / `renderKeys()` / `createKeyBtn` 部分）替换为：

```javascript
  <script src="./assets/api.js"></script>
  <script>
    async function loadKeys() {
      try {
        const keys = await getKeys();
        renderKeys(keys);
      } catch (err) {
        if (err.message.includes('Unauthorized')) return;  // 已跳转
        document.getElementById('keyList').innerHTML =
          '<p style="color:red;">加载失败：' + err.message + '</p>';
      }
    }

    function renderKeys(keys) {
      const root = document.getElementById('keyList');
      if (!keys || keys.length === 0) {
        root.innerHTML = '<p class="inline-note">暂无 API Key，点击上方按钮创建。</p>';
        return;
      }
      root.innerHTML = keys.map(item => `
        <div class="key-row">
          <div class="key-meta">
            <h3>${item.key_name || item.name || 'Unnamed Key'}</h3>
            <p>${maskToken(item.token)} · ${item.status} · ${item.created_at || item.createdAt || ''}</p>
          </div>
          <div class="key-actions">
            <span class="tag">${item.status}</span>
            <button class="btn-secondary" data-copy="${item.token}">复制</button>
            ${item.status === 'active' ? `<button class="btn-danger" data-revoke="${item.id}">撤销</button>` : ''}
          </div>
        </div>
      `).join('');

      root.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.copy);
          btn.textContent = '已复制';
          setTimeout(() => { btn.textContent = '复制'; }, 1200);
        });
      });

      root.querySelectorAll('[data-revoke]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await revokeKey(btn.dataset.revoke);
            loadKeys();
          } catch (err) {
            alert('撤销失败：' + err.message);
          }
        });
      });
    }

    document.getElementById('createKeyBtn').addEventListener('click', async () => {
      try {
        await createKey('New Key');
        loadKeys();
      } catch (err) {
        alert('创建失败：' + err.message);
      }
    });

    loadKeys();
  </script>
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add api-keys.html && git commit -m "feat(frontend): api-keys page - replace localStorage with real API calls"
```

---

## Task 8: 清理 console.js 废弃函数

**Files:**
- Modify: `assets/console.js`

- [ ] **Step 1: 清理模拟数据函数，保留 UI 工具**

将 `assets/console.js` 替换为以下精简版本（移除 localStorage 模拟数据，保留工具函数）：

```javascript
// ============================================================
// 认证工具
// ============================================================

function requireAuth() {
  // 通过 Cookie 认证，401 由 api.js 处理重定向
  return true;
}

function logout() {
  authLogout().then(() => {
    window.location.href = './login.html';
  }).catch(() => {
    window.location.href = './login.html';
  });
}

// ============================================================
// Token 工具
// ============================================================

function maskToken(token) {
  if (!token || token.length < 10) return token || '';
  return `${token.slice(0, 10)}••••••${token.slice(-4)}`;
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add assets/console.js && git commit -m "refactor(frontend): clean up console.js - remove localStorage demo, keep UI utils"
```

---

## Task 9: 端到端测试验证

**Files:**
- Modify: `backend/test_api.py`（添加 Cookie 相关测试）

- [ ] **Step 1: 在 backend/test_api.py 末尾添加 Cookie 测试**

在文件末尾（最后一个测试函数之后）添加以下新测试函数：

```python
def test_login_sets_cookie(client):
    """登录后应设置 HttpOnly Cookie"""
    rv = client.post("/api/auth/register", json={
        "email": "cookie_test@example.com",
        "password": "test123456"
    })
    rv = client.post("/api/auth/login", json={
        "email": "cookie_test@example.com",
        "password": "test123456"
    })
    assert rv.status_code == 200
    cookies = rv.headers.getlist("Set-Cookie")
    assert any("token=" in c and "HttpOnly" in c for c in cookies), \
        "Response should set HttpOnly Cookie"


def test_logout_clears_cookie(client):
    """登出后应清除 Cookie"""
    # 先登录
    client.post("/api/auth/register", json={
        "email": "logout_test@example.com", "password": "test123456"
    })
    login_rv = client.post("/api/auth/login", json={
        "email": "logout_test@example.com", "password": "test123456"
    })
    # 提取 Cookie
    cookies = login_rv.headers.getlist("Set-Cookie")
    token_cookie = next((c for c in cookies if "token=" in c), "")
    cookie_header = token_cookie.split(";")[0].split("=")[1]

    # 调用登出
    rv = client.post("/api/auth/logout", headers={"Cookie": f"token={cookie_header}"})
    assert rv.status_code == 200
    # 验证 Cookie 被清除
    logout_cookies = rv.headers.getlist("Set-Cookie")
    assert any("token=" in c and ("Max-Age=0" in c or "expires=" in c.lower()) for c in logout_cookies), \
        "Logout should clear token cookie"


def test_cookie_auth_for_keys(client, auth_token):
    """使用 Cookie（而非 Authorization Header）访问 Key 接口"""
    # 模拟 Cookie 环境
    client.post("/api/auth/register", json={
        "email": "cookie_auth@example.com", "password": "test123456"
    })
    login_rv = client.post("/api/auth/login", json={
        "email": "cookie_auth@example.com", "password": "test123456"
    })
    cookie_hdr = login_rv.headers.getlist("Set-Cookie")[0]
    token_val = cookie_hdr.split(";")[0].replace("token=", "")

    # 用 Cookie 创建 Key
    rv = client.post("/api/keys",
                     json={"name": "Cookie Test Key"},
                     headers={"Cookie": f"token={token_val}"})
    assert rv.status_code == 201, rv.get_json()
```

- [ ] **Step 2: 运行测试**

```bash
cd D:/NetWork && python -m pytest backend/test_api.py -v
```

预期结果：所有原有测试 + 3 个新 Cookie 测试均通过。

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/test_api.py && git commit -m "test(backend): add Cookie auth integration tests"
```

---

## 实施顺序

| # | 任务 | 说明 |
|---|------|------|
| 1 | 后端 Cookie 认证 | auth_routes.py 改登录/登出 |
| 2 | Cookie 读取中间件 | key_routes.py + usage_routes.py |
| 3 | Flask 静态托管 | ai_hub_backend.py 开发环境 |
| 4 | 前端 API 层 | assets/api.js 新建 |
| 5 | 登录页改造 | login.html |
| 6 | 控制台概览改造 | dashboard.html |
| 7 | API Key 管理改造 | api-keys.html |
| 8 | 清理 console.js | 移除废弃模拟函数 |
| 9 | 端到端测试 | 新增 Cookie 测试用例 |

---

## 自查清单（实施前请确认）

- [ ] 后端已安装依赖：`pip install flask pyjwt passlib bcrypt requests`
- [ ] 数据库文件 `backend/data/aihubs.db` 存在（之前测试已初始化）
- [ ] 设计文档已阅读：`docs/superpowers/specs/2026-04-16-frontend-backend-integration-design.md`
