# 国内外智能路由实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同一套代码支持国内外请求智能路由——国内用户请求走国内 Provider（阿里云、智谱、DeepSeek），海外用户走海外 Provider（OpenAI、Anthropic、Google）。

**Architecture:**
- 用户地区优先读取账户字段，未配置则通过 IP 归属地自动探测并写入 DB
- `platform_key` 表增加 `region` 字段，实现 CN/OVERSEAS/GLOBAL 三区 Key 隔离
- IP 探测使用纯本地 `ip2region` 库，无外部 HTTP 依赖

**Tech Stack:** Python (Flask) + SQLite + ip2region + Vanilla JS

---

## 文件变更总览

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 创建 | `backend/utils/ip_region.py` | IP → 地区 探测工具 |
| 创建 | `backend/data/ip2region.xdb` | IP 归属地数据文件（下载） |
| 修改 | `backend/data/database.py` | 增加 region 字段迁移 |
| 修改 | `backend/download_deps.py` | 增加 ip2region 数据文件下载 |
| 修改 | `backend/services/key_service.py` | `validate_key` 返回中加入 `region` |
| 修改 | `backend/services/proxy_service.py` | 接入地区路由逻辑 |
| 修改 | `backend/services/admin_service.py` | `get_platform_keys_by_provider` 支持 region 筛选 |
| 修改 | `backend/services/auth_service.py` | `register` 支持 `region` 参数 |
| 修改 | `backend/routes/auth_routes.py` | 注册接口传递 `region` |
| 创建 | `backend/routes/user_routes.py` | 用户地区修改接口 |
| 修改 | `login.html` | 注册表单增加地区字段（Tab 切换） |

---

## Task 1: 数据库字段迁移

**Files:**
- Modify: `backend/data/database.py:72-111`（`init_db` 函数末尾）

- [ ] **Step 1: 修改 `init_db`，添加字段迁移逻辑**

找到 `init_db` 函数末尾，在 `conn.commit()` 之后、`print("[DB] Initialized successfully")` 之前插入：

```python
        # Migration: add region columns if not exist
        cursor.execute("PRAGMA table_info(user)")
        user_columns = [col[1] for col in cursor.fetchall()]
        if "region" not in user_columns:
            cursor.execute("ALTER TABLE user ADD COLUMN region VARCHAR(10) DEFAULT NULL")
            print("[DB] Added 'region' column to user table")

        cursor.execute("PRAGMA table_info(platform_key)")
        pk_columns = [col[1] for col in cursor.fetchall()]
        if "region" not in pk_columns:
            cursor.execute("ALTER TABLE platform_key ADD COLUMN region VARCHAR(10) DEFAULT 'GLOBAL'")
            print("[DB] Added 'region' column to platform_key table")

        conn.commit()
```

> **注意：** 找到 `conn.commit()` 和 `print("[DB] Initialized successfully")` 所在行，将迁移代码插入两者之间。

- [ ] **Step 2: 提交**

```bash
git add backend/data/database.py
git commit -m "feat(db): add region columns migration to user and platform_key tables
```

---

## Task 2: IP 归属地探测工具

**Files:**
- Create: `backend/utils/ip_region.py`
- Modify: `backend/download_deps.py`

### 2.1 下载 ip2region 数据文件

- [ ] **Step 1: 修改 `download_deps.py`，追加 ip2region 下载**

在文件末尾添加：

```python
import urllib.request

IP2REGION_URL = "https://github.com/lionsoul2014/ip2region/raw/master/data/ip2region.xdb"
IP2REGION_DEST = os.path.join(os.path.dirname(__file__), "data", "ip2region.xdb")

if not os.path.exists(IP2REGION_DEST):
    print(f"Downloading ip2region data file...")
    urllib.request.urlretrieve(IP2REGION_URL, IP2REGION_DEST)
    print(f"Saved to {IP2REGION_DEST}")
else:
    print(f"ip2region data file already exists at {IP2REGION_DEST}")
```

- [ ] **Step 2: 运行下载**

```bash
cd D:/NetWork/backend && python download_deps.py
```
预期输出包含 `Downloading ip2region data file...` 和 `Saved to ...ip2region.xdb`

- [ ] **Step 3: 提交**

```bash
git add backend/download_deps.py
git commit -m "feat(deps): download ip2region.xdb data file
```

### 2.2 编写 IP 探测工具

- [ ] **Step 1: 创建 `backend/utils/ip_region.py`**

```python
"""IP 归属地探测工具（基于 ip2region）"""
import os
import struct
from typing import Literal

Region = Literal["CN", "OVERSEAS"]

_XDB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ip2region.xdb")
_xdb_fh = None  # 全局文件句柄


def _load_xdb():
    """延迟加载 xdb 文件到内存"""
    global _xdb_fh
    if _xdb_fh is None:
        _xdb_fh = open(_XDB_PATH, "rb")
    return _xdb_fh


def _get_region_index(buff: bytes) -> tuple[int, int]:
    """解析 xdb 头部，返回 (第一个索引偏移, 索引数量)"""
    index_head = struct.unpack("<iii", buff[:12])
    return index_head[1], index_head[2]


def ip_to_region(ip: str) -> Region:
    """
    将 IP 地址转换为地区标识。
    中国大陆返回 'CN'，其余返回 'OVERSEAS'。
    无法判断时默认返回 'OVERSEAS'。
    """
    import socket
    try:
        ip_num = _ip_to_num(socket.gethostbyname(ip))
    except socket.gaierror:
        return "OVERSEAS"

    try:
        fh = _load_xdb()
        fh.seek(0)
        _, total = _get_region_index(fh.read(8192))
        fh.seek(0)

        # 二分查找
        l, r = 0, total - 1
        data_len, data_ptr = 0, 0

        while l <= r:
            mid = (l + r) >> 1
            fh.seek(8192 + mid * 12)
            mid_data = fh.read(12)
            sip = struct.unpack("<I", mid_data[:4])[0]

            if ip_num < sip:
                r = mid - 1
            else:
                eip = struct.unpack("<I", mid_data[4:8])[0]
                data_ptr = struct.unpack("<I", mid_data[8:12])[0]
                if ip_num <= eip:
                    fh.seek(data_ptr)
                    data_len = struct.unpack("<H", fh.read(2))[0]
                    region_str = fh.read(data_len).decode("utf-8")
                    break
                l = mid + 1

        if "中国" in region_str or "CN" in region_str:
            return "CN"
        return "OVERSEAS"
    except Exception:
        return "OVERSEAS"


def _ip_to_num(ip: str) -> int:
    """将点分十进制 IP 转为整数"""
    parts = ip.split(".")
    return (int(parts[0]) << 24) | (int(parts[1]) << 16) | (int(parts[2]) << 8) | int(parts[3])


def get_client_ip(request) -> str:
    """
    从 Flask 请求中获取真实客户端 IP。
    优先取 X-Forwarded-For / X-Real-IP 头，否则取 remote_addr。
    """
    forwarded = request.headers.get("X-Forwarded-For", "").split(",")
    if forwarded and forwarded[0].strip():
        return forwarded[0].strip()
    real_ip = request.headers.get("X-Real-IP", "")
    if real_ip:
        return real_ip.strip()
    return request.remote_addr or "127.0.0.1"
```

- [ ] **Step 2: 提交**

```bash
git add backend/utils/ip_region.py
git commit -m "feat(utils): add ip_region detection module using ip2region
```

---

## Task 3: Key 服务支持地区筛选

**Files:**
- Modify: `backend/services/key_service.py:51-63`（`validate_key` 函数）
- Modify: `backend/services/admin_service.py:58-65`（`get_platform_keys_by_provider` 函数）

- [ ] **Step 1: 修改 `validate_key`，返回用户 region**

将查询结果处理部分改为：

```python
        if not row:
            return None
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "status": row["status"],
            "balance": row["balance"],
            "role": row["role"],
            "region": row.get("region"),
        }
```

- [ ] **Step 2: 修改 `get_platform_keys_by_provider`，支持 region 参数**

将函数签名改为：

```python
def get_platform_keys_by_provider(provider: str, region: str = "GLOBAL") -> list[dict]:
    """获取指定 provider 和地区的可用 Key。
    优先级：region 完全匹配 > GLOBAL 降级兜底
    """
    with get_cursor() as cursor:
        # 1. 优先匹配指定地区
        cursor.execute(
            "SELECT * FROM platform_key WHERE provider = ? AND region = ? AND status = 'active'",
            (provider, region)
        )
        rows = cursor.fetchall()
        if rows:
            return [dict(row) for row in rows]
        # 2. 降级：GLOBAL Key
        cursor.execute(
            "SELECT * FROM platform_key WHERE provider = ? AND region = 'GLOBAL' AND status = 'active'",
            (provider,)
        )
        return [dict(row) for row in cursor.fetchall()]
```

- [ ] **Step 3: 提交**

```bash
git add backend/services/key_service.py backend/services/admin_service.py
git commit -m "feat(services): add region support to key validation and platform key lookup
```

---

## Task 4: 代理服务接入地区路由

**Files:**
- Modify: `backend/services/proxy_service.py`（多个函数）

### 4.1 修改 `select_platform_key`

将 `select_platform_key` 函数替换为：

```python
def select_platform_key(provider: str, region: str) -> dict | None:
    """从平台 Key 池中选择一个可用的 Key"""
    keys = admin_service.get_platform_keys_by_provider(provider, region)
    if not keys:
        return None
    return keys[0]
```

### 4.2 修改 `proxy_chat_request`

在 `# 1. 验证 Key` 块之后（`user_id = key_info["user_id"]` 之后），插入地区处理块：

```python
    # 1.5 获取用户地区（未配置则自动探测）
    from utils.ip_region import get_client_ip, ip_to_region
    user_region = key_info.get("region")
    if not user_region:
        client_ip = get_client_ip(request)
        user_region = ip_to_region(client_ip)
        # 写入用户账户（仅首次）
        from data.database import get_cursor
        with get_cursor() as cursor:
            cursor.execute(
                "UPDATE user SET region = ? WHERE id = ?",
                (user_region, user_id)
            )
```

然后修改 `provider = get_provider(model)` 块，将原来的：

```python
    platform_key = select_platform_key(provider)
```

改为：

```python
    platform_key = select_platform_key(provider, user_region)
```

### 4.3 补全函数签名（Flask 请求上下文）

在 `proxy_chat_request` 顶部添加参数注解说明。找到函数签名：

```python
def proxy_chat_request(bearer_token: str, request_data: dict) -> tuple[dict | None, int, str]:
```

由于地区探测需要 `request` 对象，找到调用处（在 `routes/chat_routes.py`）并修改调用：

在 `backend/routes/chat_routes.py` 中，将：

```python
    result, status_code, error = proxy_service.proxy_chat_request(bearer_token, request_data)
```

改为：

```python
    result, status_code, error = proxy_service.proxy_chat_request(bearer_token, request_data, request)
```

然后在 `proxy_service.py` 中将函数签名改为：

```python
def proxy_chat_request(bearer_token: str, request_data: dict, flask_request=None) -> tuple[dict | None, int, str]:
```

并修改 `get_client_ip(request)` 为 `get_client_ip(flask_request or request)` 的逻辑：

在函数内部，将 `from utils.ip_region import get_client_ip, ip_to_region` 移到文件顶部（和其他 import 一起），然后在地区探测处直接用 `flask_request`：

```python
        client_ip = get_client_ip(flask_request)
```

### 4.4 添加错误处理

在地区探测失败时返回错误。在地区处理块之后添加：

```python
    if not user_region:
        return None, 400, "Unable to detect region, please contact support"
```

- [ ] **Step 1: 修改 `backend/services/proxy_service.py`**
- [ ] **Step 2: 修改 `backend/routes/chat_routes.py` 中的调用**
- [ ] **Step 3: 在 `proxy_service.py` 顶部添加 ip_region import**
- [ ] **Step 4: 提交**

```bash
git add backend/services/proxy_service.py backend/routes/chat_routes.py
git commit -m "feat(proxy): integrate region-based routing with IP auto-detection
```

---

## Task 5: 注册接口支持地区参数

**Files:**
- Modify: `backend/services/auth_service.py:8-23`（`register` 函数）
- Modify: `backend/routes/auth_routes.py:7-13`（`register` 路由）
- Modify: `login.html`（注册 Tab）

### 5.1 修改 `auth_service.register`

将函数签名改为：

```python
def register(email: str, password: str, region: str = None) -> tuple[bool, str]:
```

在 `cursor.execute("INSERT INTO user ...")` 前插入地区值处理：

```python
        # 默认值：如果未传入 region，保持 NULL（后续首次请求时自动探测）
        region_value = region if region in ("CN", "OVERSEAS") else None
```

将 INSERT 语句改为：

```python
        cursor.execute(
            "INSERT INTO user (email, password, balance, region) VALUES (?, ?, ?, ?)",
            (email, hashed, 10.0, region_value)
        )
```

### 5.2 修改 `auth_routes.register`

将 `data.get("password", "")` 行后添加：

```python
    region = data.get("region")
    success, message = __import__("services.auth_service", fromlist=["register"]).register(email, password, region)
```

### 5.3 修改登录页面（增加注册 Tab）

- [ ] **Step 1: 在 `login.html` 的 `<form id="loginForm">` 之前插入注册表单**

将 `</p>` 后的内容改为：

```html
      <div class="auth-tabs" style="display:flex; gap:8px; margin-bottom:20px;">
        <button class="tab-btn active" type="button" onclick="switchTab('login')">登录</button>
        <button class="tab-btn" type="button" onclick="switchTab('register')">注册</button>
      </div>

      <!-- 登录表单 -->
      <form id="loginForm" class="auth-form">
        <div class="field">
          <label for="login-email">邮箱</label>
          <input id="login-email" name="email" type="email" placeholder="you@example.com" value="demo@aihub.com" required />
        </div>
        <div class="field">
          <label for="login-password">密码</label>
          <input id="login-password" name="password" type="password" placeholder="请输入密码" value="12345678" required />
        </div>
        <button class="btn-primary" type="submit" style="width:100%; justify-content:center;">登录并进入控制台</button>
      </form>

      <!-- 注册表单 -->
      <form id="registerForm" class="auth-form" style="display:none;">
        <div class="field">
          <label for="reg-email">邮箱</label>
          <input id="reg-email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="field">
          <label for="reg-password">密码</label>
          <input id="reg-password" name="password" type="password" placeholder="不少于6位" required minlength="6" />
        </div>
        <div class="field">
          <label for="reg-region">主要使用地区</label>
          <select id="reg-region" name="region">
            <option value="CN">🇨🇳 国内（推荐）</option>
            <option value="OVERSEAS">🌐 海外</option>
          </select>
        </div>
        <button class="btn-primary" type="submit" style="width:100%; justify-content:center;">注册并登录</button>
      </form>
```

- [ ] **Step 2: 在 `<script>` 末尾添加 Tab 切换和注册逻辑**

```javascript
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
      if (tab === 'login') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('loginForm').style.display = '';
      } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('registerForm').style.display = '';
      }
    }

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      try {
        await authLogin(email, password);
        window.location.href = './dashboard.html';
      } catch (err) {
        alert('登录失败：' + err.message);
      }
    });

    document.getElementById('registerForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const region = document.getElementById('reg-region').value;
      try {
        await authRegister(email, password);
        // 注册成功后自动登录
        await authLogin(email, password);
        window.location.href = './dashboard.html';
      } catch (err) {
        alert('注册失败：' + err.message);
      }
    });
```

将 `authRegister` 的调用中传入 region（在 `authRegister` 尚未支持 region 参数前，先只传 email/password，region 在 api.js 中处理）。

### 5.4 更新 `authRegister` API 调用支持 region

修改 `assets/api.js` 中的 `authRegister`：

```javascript
async function authRegister(email, password, region = null) {
  const body = { email, password };
  if (region) body.region = region;
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

然后在 `login.html` 的注册提交逻辑中改为：

```javascript
        await authRegister(email, password, region);
```

- [ ] **Step 3: 提交**

```bash
git add backend/services/auth_service.py backend/routes/auth_routes.py login.html assets/api.js
git commit -m "feat(auth): support region parameter in registration flow
```

---

## Task 6: 用户地区修改接口

**Files:**
- Create: `backend/routes/user_routes.py`
- Modify: `backend/ai_hub_backend.py`（注册新蓝图）

- [ ] **Step 1: 创建 `backend/routes/user_routes.py`**

```python
"""用户账户设置路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import extract_token_from_header, verify_token
from services import auth_service

user_bp = Blueprint("user", __name__, url_prefix="/api/user")


def _get_user_from_token():
    """从请求头提取并验证用户"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, jsonify({"success": False, "message": "Unauthorized"}), 401
    token = auth_header[7:]
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"success": False, "message": "Invalid token"}), 401
    return payload, None, None


@user_bp.route("/me", methods=["GET"])
def get_profile():
    """获取当前用户信息（含 region）"""
    payload, error_resp, status = _get_user_from_token()
    if error_resp:
        return error_resp, status
    user_id = payload["user_id"]
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id, email, balance, role, region, created_at FROM user WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "User not found"}), 404
        return jsonify({"success": True, "data": dict(row)}), 200


@user_bp.route("/region", methods=["PUT"])
def update_region():
    """更新用户地区"""
    payload, error_resp, status = _get_user_from_token()
    if error_resp:
        return error_resp, status
    data = request.get_json() or {}
    region = data.get("region", "")
    if region not in ("CN", "OVERSEAS"):
        return jsonify({"success": False, "message": "Invalid region value"}), 400
    user_id = payload["user_id"]
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET region = ? WHERE id = ?", (region, user_id))
    return jsonify({"success": True, "message": "Region updated"}), 200
```

- [ ] **Step 2: 在 `ai_hub_backend.py` 中注册新蓝图**

在 `register_blueprints()` 函数中添加：

```python
    from routes.user_routes import user_bp
    app.register_blueprint(user_bp)
```

- [ ] **Step 3: 在 `api.js` 中添加前端调用**

在 `assets/api.js` 末尾添加：

```javascript
// ---- 用户设置 ----

async function getProfile() {
  return request('/api/user/me');
}

async function updateRegion(region) {
  return request('/api/user/region', {
    method: 'PUT',
    body: JSON.stringify({ region }),
  });
}
```

- [ ] **Step 4: 提交**

```bash
git add backend/routes/user_routes.py backend/ai_hub_backend.py assets/api.js
git commit -m "feat(user): add user profile and region update endpoints
```

---

## Task 7: 功能验证测试

**Files:**
- Test: `backend/test_api.py`（新建路由测试函数）

- [ ] **Step 1: 手动测试 IP 探测**

```bash
cd D:/NetWork/backend && python -c "
from utils.ip_region import ip_to_region, get_client_ip
print('127.0.0.1 =>', ip_to_region('127.0.0.1'))
print('8.8.8.8 =>', ip_to_region('8.8.8.8'))
print('114.114.114.114 =>', ip_to_region('114.114.114.114'))
"
```
预期：127.0.0.1 → OVERSEAS（默认），8.8.8.8 → OVERSEAS，114.114.114 → CN（国内DNS）

- [ ] **Step 2: 启动后端并测试注册带 region**

```bash
cd D:/NetWork/backend && python ai_hub_backend.py
```

另开终端：
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cn.com","password":"test123","region":"CN"}'
# 预期：{"success": true, "message": "注册成功"}

curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@overseas.com","password":"test123","region":"OVERSEAS"}'
# 预期：{"success": true, "message": "注册成功"}
```

- [ ] **Step 3: 测试地区字段自动探测**

注册一个不带 region 的用户，然后登录并调用 `/api/user/me` 查看 region 初始为空，发起一次 chat 请求后再次查看，region 应被自动填充。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "test: verify region routing feature end-to-end
```

---

## 实施检查清单

完成所有 Task 后，确认以下内容：

- [ ] `user.region` 字段迁移正常运行（重启后端不报错）
- [ ] `platform_key.region` 字段默认为 `GLOBAL`
- [ ] IP 探测对国内/海外 IP 正确返回 CN/OVERSEAS
- [ ] 用户注册时可选择地区并正确存储
- [ ] 不带地区注册的用户，首次请求后 region 自动写入
- [ ] `platform_key` 表已有数据的 Key 默认为 GLOBAL
- [ ] 前端注册 Tab 可正常切换并提交
- [ ] `/api/user/me` 正确返回 region 字段
- [ ] `/api/user/region` PUT 可修改用户地区
