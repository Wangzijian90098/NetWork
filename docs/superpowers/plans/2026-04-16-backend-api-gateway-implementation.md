# Backend API Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个完整的 AI API 中转平台后端网关，支持用户认证、API Key 管理、聊天代理、余额扣费和用量记录。

**Architecture:** 使用 Python + Flask 框架，H2 文件数据库存储数据，JWT 管理会话。代理层兼容 OpenAI 格式请求，将请求路由至上游模型（OpenAI/Anthropic/DeepSeek 等），按模型单价扣费。

**Tech Stack:** Python 3, Flask, PyJWT, Passlib+BCrypt, requests, H2 Database (JAR)

---

## 文件结构

```
backend/
├── requirements.txt              # Python 依赖
├── ai_hub_backend.py                # 主入口：Flask 应用 + 服务器启动
├── download_deps.py               # 下载 H2 JAR 的辅助脚本
├── data/
│   ├── __init__.py
│   └── database.py                # H2 连接管理 + 表初始化 SQL
├── models/
│   ├── __init__.py
│   └── models.py                  # 数据类（User, ApiKey, PlatformKey, ModelPrice, UsageLog）
├── utils/
│   ├── __init__.py
│   ├── jwt_util.py                # JWT 签发与验证
│   └── hash_util.py               # BCrypt 密码哈希
├── services/
│   ├── __init__.py
│   ├── auth_service.py            # 注册/登录逻辑
│   ├── key_service.py             # 用户 API Key 管理
│   ├── admin_service.py           # 管理员操作（用户充值/平台Key管理/模型单价）
│   ├── proxy_service.py           # 聊天代理（核心：路由+转发+计费）
│   └── usage_service.py           # 用量查询
└── routes/
    ├── __init__.py
    ├── auth_routes.py             # /api/auth/*
    ├── key_routes.py              # /api/keys/*
    ├── chat_routes.py             # /v1/chat/completions 等
    ├── admin_routes.py            # /api/admin/*
    └── usage_routes.py            # /v1/account/usage
```

> **注：** Python 在 Windows 原生可用，无需安装 Kotlin 编译器。

---

## Task 1: 项目初始化 — 目录结构与依赖

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/download_deps.py`
- Create: `backend/data/__init__.py`
- Create: `backend/models/__init__.py`
- Create: `backend/utils/__init__.py`
- Create: `backend/services/__init__.py`
- Create: `backend/routes/__init__.py`
- Modify: `D:/NetWork/README.md`（添加后端运行说明）

- [ ] **Step 1: 创建 requirements.txt**

```txt
flask==3.0.3
pyjwt==2.9.0
passlib[bcrypt]==1.7.4
requests==2.32.3
```

- [ ] **Step 2: 创建目录结构**

```bash
mkdir -p backend/data backend/models backend/utils backend/services backend/routes
touch backend/data/__init__.py backend/models/__init__.py backend/utils/__init__.py backend/services/__init__.py backend/routes/__init__.py
```

- [ ] **Step 3: 创建 download_deps.py（下载 H2 JAR）**

```python
#!/usr/bin/env python3
"""下载 H2 Database JAR（用于通过 JayDeBeApi 连接 H2）"""
import urllib.request
import os

H2_VERSION = "2.2.224"
JAR_URL = f"https://repo1.maven.org/maven2/com/h2database/h2/{H2_VERSION}/h2-{H2_VERSION}.jar"
DEST = os.path.join(os.path.dirname(__file__), "h2.jar")

if not os.path.exists(DEST):
    print(f"Downloading H2 {H2_VERSION}...")
    urllib.request.urlretrieve(JAR_URL, DEST)
    print(f"Saved to {DEST}")
else:
    print(f"H2 JAR already exists at {DEST}")
```

- [ ] **Step 4: 安装 Python 依赖**

```bash
cd D:/NetWork/backend && pip install flask pyjwt passlib requests
```

> 注意：passlib 需要 bcrypt 库，Windows 上可能需要额外安装 Microsoft Visual C++ Build Tools。如遇问题可使用 `pip install flask pyjwt passlib bcrypt requests`。

- [ ] **Step 5: 更新 README.md（添加后端运行说明）**

在 README.md 末尾添加：

```markdown
## 后端运行

```bash
cd D:\NetWork/backend
pip install -r requirements.txt
python download_deps.py   # 首次运行下载 H2 JAR
python ai_hub_backend.py    # 启动服务 http://localhost:8080
```

后端 API 文档见 `docs/superpowers/specs/2026-04-16-backend-api-gateway-design.md`
```

- [ ] **Step 6: Commit**

```bash
cd D:/NetWork && git add backend/requirements.txt backend/download_deps.py backend/data backend/models backend/utils backend/services backend/routes README.md && git commit -m "feat(backend): project init - structure, deps, H2 download script"
```

---

## Task 2: 数据模型 — models/models.py

**Files:**
- Create: `backend/models/models.py`

- [ ] **Step 1: 编写数据模型（复制以下完整代码）**

```python
"""数据模型类"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: int
    email: str
    password: str  # BCrypt 哈希
    balance: float  # 美元
    role: str  # 'user' | 'admin'
    created_at: datetime
    updated_at: datetime


@dataclass
class ApiKey:
    id: int
    user_id: int
    key_name: str
    token: str  # sk-aihub-xxx
    status: str  # 'active' | 'revoked'
    created_at: datetime


@dataclass
class PlatformKey:
    id: int
    provider: str  # 'openai' | 'anthropic' | 'deepseek' | ...
    key_token: str
    base_url: str
    status: str  # 'active' | 'exhausted' | 'revoked'
    created_at: datetime


@dataclass
class ModelPrice:
    id: int
    model: str  # 'gpt-4o' | 'claude-sonnet-4-6' | ...
    provider: str
    price_per_1k_input: float  # 美元
    price_per_1k_output: float  # 美元
    enabled: bool


@dataclass
class UsageLog:
    id: int
    user_id: int
    api_key_id: int
    model: str
    input_tokens: int
    output_tokens: int
    cost: float  # 美元
    request_time: datetime
    request_id: str
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add backend/models/models.py && git commit -m "feat(backend): add data models"
```

---

## Task 3: 数据库层 — data/database.py

**Files:**
- Create: `backend/data/database.py`

- [ ] **Step 1: 编写数据库模块（复制以下完整代码）**

```python
"""H2 数据库连接管理 + 表初始化"""
import os
import sqlite3  # 使用 SQLite（零配置，H2 格式兼容）作为开发数据库
from contextlib import contextmanager

# 生产环境替换为：jaydebeapi + H2 JAR（仅需更换连接字符串）
# 本实现使用 SQLite 以降低门槛，后期可无缝迁移至 H2/MySQL

DB_PATH = os.path.join(os.path.dirname(__file__), "aihubs.db")
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,4) DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_key (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_name VARCHAR(100),
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS platform_key (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider VARCHAR(50) NOT NULL,
    key_token VARCHAR(255) NOT NULL,
    base_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_price (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    price_per_1k_input DECIMAL(10,6) NOT NULL,
    price_per_1k_output DECIMAL(10,6) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_key_id INTEGER NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (api_key_id) REFERENCES api_key(id)
);
"""


def get_connection():
    """获取数据库连接（thread-local）"""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_connection()
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
        # 插入默认管理员（密码: admin123）
        cursor = conn.execute(
            "SELECT id FROM user WHERE email = 'admin@aihubs.com'"
        )
        if not cursor.fetchone():
            from utils.hash_util import hash_password
            conn.execute(
                "INSERT INTO user (email, password, balance, role) VALUES (?, ?, ?, ?)",
                ("admin@aihubs.com", hash_password("admin123"), 9999.0, "admin")
            )
            conn.commit()
            print("[DB] Default admin created: admin@aihubs.com / admin123")
        # 插入默认模型价格
        default_models = [
            ("gpt-4o", "openai", 0.0025, 0.01),
            ("gpt-4o-mini", "openai", 0.00015, 0.0006),
            ("gpt-4-turbo", "openai", 0.01, 0.03),
            ("claude-sonnet-4-6", "anthropic", 0.003, 0.015),
            ("claude-sonnet-4-6", "anthropic", 0.0008, 0.004),
            ("deepseek-chat", "deepseek", 0.00014, 0.00028),
            ("deepseek-coder", "deepseek", 0.00014, 0.00028),
            ("gemini-1.5-pro", "google", 0.00125, 0.005),
            ("gemini-1.5-flash", "google", 0.000075, 0.0003),
            ("moonshot-v1-8k", "moonshot", 0.0006, 0.0006),
            ("glm-4", "zhipu", 0.0001, 0.0001),
            ("qwen-plus", "alibaba", 0.0008, 0.002),
        ]
        for model, provider, inp, outp in default_models:
            conn.execute(
                "INSERT OR IGNORE INTO model_price (model, provider, price_per_1k_input, price_per_1k_output) VALUES (?, ?, ?, ?)",
                (model, provider, inp, outp)
            )
        conn.commit()
        print("[DB] Initialized successfully")
    finally:
        conn.close()


@contextmanager
def get_cursor():
    """数据库上下文管理器（自动提交/回滚）"""
    conn = get_connection()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add backend/data/database.py && git commit -m "feat(backend): add database layer with SQLite and schema init"
```

---

## Task 4: 工具类 — jwt_util.py + hash_util.py

**Files:**
- Create: `backend/utils/jwt_util.py`
- Create: `backend/utils/hash_util.py`

- [ ] **Step 1: 编写 JWT 工具（复制以下完整代码）**

```python
"""JWT Token 签发与验证"""
import jwt
import datetime

SECRET_KEY = "aihubs-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def generate_token(user_id: int, email: str, role: str) -> str:
    """签发 JWT Token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRE_DAYS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    """验证 JWT Token，返回 payload 或 None"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def extract_token_from_header(auth_header: str | None) -> str | None:
    """从 Authorization: Bearer <token> 提取 Token"""
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]
```

- [ ] **Step 2: 编写 BCrypt 工具（复制以下完整代码）**

```python
"""密码哈希工具（BCrypt）"""
from passlib.hash import bcrypt


def hash_password(password: str) -> str:
    """哈希密码"""
    return bcrypt.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    return bcrypt.verify(password, hashed)
```

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/utils/jwt_util.py backend/utils/hash_util.py && git commit -m "feat(backend): add JWT and BCrypt utility modules"
```

---

## Task 5: 认证服务与路由 — auth_service.py + auth_routes.py

**Files:**
- Create: `backend/services/auth_service.py`
- Create: `backend/routes/auth_routes.py`
- Modify: `backend/ai_hub_backend.py`（注册蓝图）

- [ ] **Step 1: 编写认证服务（复制以下完整代码）**

```python
"""认证服务"""
from data.database import get_cursor
from utils.hash_util import hash_password, verify_password
from utils.jwt_util import generate_token
from models.models import User


def register(email: str, password: str) -> tuple[bool, str]:
    """注册用户。返回 (成功, 消息)"""
    if not email or not password:
        return False, "邮箱和密码不能为空"
    if len(password) < 6:
        return False, "密码长度不能少于6位"
    with get_cursor() as cursor:
        cursor.execute("SELECT id FROM user WHERE email = ?", (email,))
        if cursor.fetchone():
            return False, "该邮箱已注册"
        hashed = hash_password(password)
        cursor.execute(
            "INSERT INTO user (email, password, balance) VALUES (?, ?, ?)",
            (email, hashed, 10.0)  # 新用户送 $10 体验金
        )
    return True, "注册成功"


def login(email: str, password: str) -> tuple[bool, dict | None, str]:
    """登录。返回 (成功, 用户数据, JWT)"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            return False, None, "邮箱或密码错误"
        if not verify_password(password, row["password"]):
            return False, None, "邮箱或密码错误"
        token = generate_token(row["id"], row["email"], row["role"])
        user = {
            "id": row["id"],
            "email": row["email"],
            "balance": row["balance"],
            "role": row["role"],
        }
        return True, {"token": token, "user": user}, ""
```

- [ ] **Step 2: 编写认证路由（复制以下完整代码）**

```python
"""认证路由"""
from flask import Blueprint, request, jsonify

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
        return jsonify({"success": True, "data": user_data}), 200
    return jsonify({"success": False, "message": error}), 401
```

- [ ] **Step 3: 注册蓝图到主应用（在 ai_hub_backend.py 中添加，详见 Task 8）**

> 暂时跳过，等 Task 8 再操作。

- [ ] **Step 4: Commit**

```bash
cd D:/NetWork && git add backend/services/auth_service.py backend/routes/auth_routes.py && git commit -m "feat(backend): add authentication service and routes"
```

---

## Task 6: API Key 管理服务与路由 — key_service.py + key_routes.py

**Files:**
- Create: `backend/services/key_service.py`
- Create: `backend/routes/key_routes.py`

- [ ] **Step 1: 编写 Key 服务（复制以下完整代码）**

```python
"""用户 API Key 管理服务"""
import secrets
from data.database import get_cursor


def generate_key_token() -> str:
    """生成唯一的 Key Token"""
    return f"sk-aihub-{secrets.token_hex(16)}"


def create_key(user_id: int, name: str) -> dict | None:
    """为用户创建新的 API Key"""
    token = generate_key_token()
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO api_key (user_id, key_name, token) VALUES (?, ?, ?)",
            (user_id, name, token)
        )
        key_id = cursor.lastrowid
        cursor.execute("SELECT * FROM api_key WHERE id = ?", (key_id,))
        row = cursor.fetchone()
        return {
            "id": row["id"],
            "name": row["key_name"],
            "token": row["token"],
            "status": row["status"],
            "created_at": row["created_at"],
        }


def get_keys_by_user(user_id: int) -> list[dict]:
    """获取用户所有 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id, user_id, key_name, token, status, created_at FROM api_key WHERE user_id = ?",
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]


def revoke_key(user_id: int, key_id: int) -> bool:
    """撤销用户的 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE api_key SET status = 'revoked' WHERE id = ? AND user_id = ? AND status = 'active'",
            (key_id, user_id)
        )
        return cursor.rowcount > 0


def validate_key(token: str) -> dict | None:
    """验证 Key 并返回关联用户信息。返回 None 表示无效"""
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT ak.id, ak.user_id, ak.status, u.balance, u.role
            FROM api_key ak
            JOIN user u ON u.id = ak.user_id
            WHERE ak.token = ?
        """, (token,))
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)
```

- [ ] **Step 2: 编写 Key 路由（复制以下完整代码）**

```python
"""API Key 管理路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_token, extract_token_from_header

key_bp = Blueprint("keys", __name__, url_prefix="/api/keys")


def require_auth():
    """验证 JWT Token，返回 user_id"""
    token = extract_token_from_header(request.headers.get("Authorization"))
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    return payload["user_id"], None, None


@key_bp.route("", methods=["GET"])
def list_keys():
    user_id, error, status = require_auth()
    if error:
        return error, status
    keys = __import__("services.key_service", fromlist=["get_keys_by_user"]).get_keys_by_user(user_id)
    return jsonify({"success": True, "data": keys}), 200


@key_bp.route("", methods=["POST"])
def create_key():
    user_id, error, status = require_auth()
    if error:
        return error, status
    data = request.get_json() or {}
    name = data.get("name", "My API Key")
    key = __import__("services.key_service", fromlist=["create_key"]).create_key(user_id, name)
    return jsonify({"success": True, "data": key}), 201


@key_bp.route("/<int:key_id>", methods=["DELETE"])
def revoke_key(key_id):
    user_id, error, status = require_auth()
    if error:
        return error, status
    ok = __import__("services.key_service", fromlist=["revoke_key"]).revoke_key(user_id, key_id)
    if ok:
        return jsonify({"success": True, "message": "Key 已撤销"}), 200
    return jsonify({"success": False, "message": "Key 不存在或已撤销"}), 404
```

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/services/key_service.py backend/routes/key_routes.py && git commit -m "feat(backend): add API key management service and routes"
```

---

## Task 7: 管理员服务与路由 — admin_service.py + admin_routes.py

**Files:**
- Create: `backend/services/admin_service.py`
- Create: `backend/routes/admin_routes.py`

- [ ] **Step 1: 编写管理员服务（复制以下完整代码）**

```python
"""管理员服务：用户管理 / 平台 Key 管理 / 模型单价管理"""
from data.database import get_cursor


# ---- 用户管理 ----

def get_users() -> list[dict]:
    """获取所有用户列表"""
    with get_cursor() as cursor:
        cursor.execute("SELECT id, email, balance, role, created_at, updated_at FROM user ORDER BY id")
        return [dict(row) for row in cursor.fetchall()]


def recharge_user(user_id: int, amount: float) -> bool:
    """给用户充值"""
    if amount <= 0:
        return False
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET balance = balance + ? WHERE id = ?", (amount, user_id))
        return cursor.rowcount > 0


def delete_user(user_id: int) -> bool:
    """删除用户（仅 admin 可操作）"""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM user WHERE id = ?", (user_id,))
        return cursor.rowcount > 0


# ---- 平台 Key 管理 ----

def get_platform_keys() -> list[dict]:
    """获取平台上游 Key 列表"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM platform_key ORDER BY id")
        return [dict(row) for row in cursor.fetchall()]


def add_platform_key(provider: str, key_token: str, base_url: str) -> dict:
    """添加平台上游 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO platform_key (provider, key_token, base_url) VALUES (?, ?, ?)",
            (provider, key_token, base_url)
        )
        key_id = cursor.lastrowid
        cursor.execute("SELECT * FROM platform_key WHERE id = ?", (key_id,))
        return dict(cursor.fetchone())


def delete_platform_key(key_id: int) -> bool:
    """删除平台 Key"""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM platform_key WHERE id = ?", (key_id,))
        return cursor.rowcount > 0


def get_platform_keys_by_provider(provider: str) -> list[dict]:
    """获取指定 provider 的可用 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM platform_key WHERE provider = ? AND status = 'active'",
            (provider,)
        )
        return [dict(row) for row in cursor.fetchall()]


# ---- 模型单价管理 ----

def get_model_prices() -> list[dict]:
    """获取所有模型单价"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM model_price ORDER BY provider, model")
        return [dict(row) for row in cursor.fetchall()]


def upsert_model_price(model: str, provider: str, price_in: float, price_out: float) -> dict:
    """添加或更新模型单价"""
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO model_price (model, provider, price_per_1k_input, price_per_1k_output)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(model) DO UPDATE SET
                provider = excluded.provider,
                price_per_1k_input = excluded.price_per_1k_input,
                price_per_1k_output = excluded.price_per_1k_output
        """, (model, provider, price_in, price_out))
        cursor.execute("SELECT * FROM model_price WHERE model = ?", (model,))
        return dict(cursor.fetchone())


def get_model_price(model: str) -> dict | None:
    """获取指定模型单价"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM model_price WHERE model = ? AND enabled = 1", (model,))
        row = cursor.fetchone()
        return dict(row) if row else None
```

- [ ] **Step 2: 编写管理员路由（复制以下完整代码）**

```python
"""管理员路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_token, extract_token_from_header

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def require_admin():
    """验证管理员权限"""
    token = extract_token_from_header(request.headers.get("Authorization"))
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    if payload.get("role") != "admin":
        return None, jsonify({"error": "Forbidden"}), 403
    return True, None, None


# ---- 用户管理 ----

@admin_bp.route("/users", methods=["GET"])
def list_users():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    users = __import__("services.admin_service", fromlist=["get_users"]).get_users()
    return jsonify({"success": True, "data": users}), 200


@admin_bp.route("/users/<int:user_id>/recharge", methods=["POST"])
def recharge(user_id):
    ok, err, status = require_admin()
    if not ok:
        return err, status
    data = request.get_json() or {}
    amount = float(data.get("amount", 0))
    ok2 = __import__("services.admin_service", fromlist=["recharge_user"]).recharge_user(user_id, amount)
    return jsonify({"success": ok2, "message": "充值成功" if ok2 else "充值失败"}), 200 if ok2 else 400


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    ok, err, status = require_admin()
    if not ok:
        return err, status
    ok2 = __import__("services.admin_service", fromlist=["delete_user"]).delete_user(user_id)
    return jsonify({"success": ok2}), 200 if ok2 else 404


# ---- 平台 Key 管理 ----

@admin_bp.route("/platform-keys", methods=["GET"])
def list_platform_keys():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    keys = __import__("services.admin_service", fromlist=["get_platform_keys"]).get_platform_keys()
    return jsonify({"success": True, "data": keys}), 200


@admin_bp.route("/platform-keys", methods=["POST"])
def add_platform_key():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    data = request.get_json() or {}
    key = __import__("services.admin_service", fromlist=["add_platform_key"]).add_platform_key(
        data.get("provider", ""), data.get("key_token", ""), data.get("base_url", "")
    )
    return jsonify({"success": True, "data": key}), 201


@admin_bp.route("/platform-keys/<int:key_id>", methods=["DELETE"])
def delete_platform_key(key_id):
    ok, err, status = require_admin()
    if not ok:
        return err, status
    ok2 = __import__("services.admin_service", fromlist=["delete_platform_key"]).delete_platform_key(key_id)
    return jsonify({"success": ok2}), 200 if ok2 else 404


# ---- 模型单价管理 ----

@admin_bp.route("/model-prices", methods=["GET"])
def list_model_prices():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    prices = __import__("services.admin_service", fromlist=["get_model_prices"]).get_model_prices()
    return jsonify({"success": True, "data": prices}), 200


@admin_bp.route("/model-prices", methods=["POST"])
def upsert_model_price():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    data = request.get_json() or {}
    price = __import__("services.admin_service", fromlist=["upsert_model_price"]).upsert_model_price(
        data.get("model", ""), data.get("provider", ""),
        float(data.get("price_per_1k_input", 0)), float(data.get("price_per_1k_output", 0))
    )
    return jsonify({"success": True, "data": price}), 201
```

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/services/admin_service.py backend/routes/admin_routes.py && git commit -m "feat(backend): add admin service and routes"
```

---

## Task 8: 聊天代理服务与路由（核心）— proxy_service.py + chat_routes.py + usage_service.py + usage_routes.py

**Files:**
- Create: `backend/services/proxy_service.py`
- Create: `backend/routes/chat_routes.py`
- Create: `backend/services/usage_service.py`
- Create: `backend/routes/usage_routes.py`

**说明：** 这是网关核心功能，实现 OpenAI 兼容的 `/v1/chat/completions` 接口。

- [ ] **Step 1: 编写代理服务（复制以下完整代码）**

```python
"""聊天代理服务：路由 + 上游转发 + 计费"""
import uuid
import requests
from datetime import datetime
from services import admin_service, key_service

# 模型 → provider 映射
MODEL_PROVIDER_MAP = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "gpt-4-turbo": "openai",
    "gpt-4": "openai",
    "gpt-3.5-turbo": "openai",
    "claude-sonnet-4-6": "anthropic",
    "claude-sonnet-4-6": "anthropic",
    "claude-3-opus": "anthropic",
    "claude-3-sonnet": "anthropic",
    "deepseek-chat": "deepseek",
    "deepseek-coder": "deepseek",
    "gemini-1.5-pro": "google",
    "gemini-1.5-flash": "google",
    "gemini-pro": "google",
    "moonshot-v1-8k": "moonshot",
    "moonshot-v1-32k": "moonshot",
    "glm-4": "zhipu",
    "glm-4v": "zhipu",
    "qwen-plus": "alibaba",
    "qwen-turbo": "alibaba",
}

# provider → base_url 映射（可在 admin 添加自定义 Key 时覆盖）
PROVIDER_BASE_URL = {
    "openai": "https://api.openai.com/v1",
    "anthropic": "https://api.anthropic.com/v1",
    "deepseek": "https://api.deepseek.com/v1",
    "google": "https://generativelanguage.googleapis.com/v1beta",
    "moonshot": "https://api.moonshot.cn/v1",
    "zhipu": "https://open.bigmodel.cn/api/paas/v4",
    "alibaba": "https://dashscope.aliyuncs.com/compatible-mode/v1",
}


def get_provider(model: str) -> str | None:
    """从模型名推断 provider"""
    # 精确匹配
    if model in MODEL_PROVIDER_MAP:
        return MODEL_PROVIDER_MAP[model]
    # 前缀匹配（如 claude-xxx → anthropic）
    for prefix, provider in MODEL_PROVIDER_MAP.items():
        if model.startswith(prefix.rsplit("-", 1)[0]) or prefix.startswith(model.split("-")[0]):
            return provider
    return None


def select_platform_key(provider: str) -> dict | None:
    """从平台 Key 池中选择一个可用的 Key"""
    keys = admin_service.get_platform_keys_by_provider(provider)
    if not keys:
        return None
    # 轮询策略：每次选第一个（可扩展为随机/评分）
    return keys[0]


def estimate_cost(model: str, messages: list) -> float:
    """估算请求费用（用于余额预扣）"""
    price = admin_service.get_model_price(model)
    if not price:
        return 0.0
    # 粗略估算：按每条消息 ~50 tokens
    estimated_tokens = len(messages) * 50
    return estimated_tokens / 1000 * (price["price_per_1k_input"] + price["price_per_1k_output"])


def deduct_balance(user_id: int, cost: float) -> bool:
    """扣减用户余额"""
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET balance = balance - ? WHERE id = ? AND balance >= ?",
                       (cost, user_id, cost))
        return cursor.rowcount > 0


def refund_balance(user_id: int, cost: float):
    """退还余额（代理失败时调用）"""
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET balance = balance + ? WHERE id = ?", (cost, user_id))


def record_usage(user_id: int, api_key_id: int, model: str,
                 input_tokens: int, output_tokens: int, cost: float, request_id: str):
    """记录用量日志"""
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO usage_log (user_id, api_key_id, model, input_tokens, output_tokens, cost, request_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, api_key_id, model, input_tokens, output_tokens, cost, request_id))


def proxy_chat_request(bearer_token: str, request_data: dict) -> tuple[dict | None, int, str]:
    """
    核心代理方法。
    返回 (上游响应json, HTTP状态码, 错误消息)
    """
    model = request_data.get("model", "")
    messages = request_data.get("messages", [])

    # 1. 验证 Key
    key_info = key_service.validate_key(bearer_token)
    if not key_info:
        return None, 401, "Invalid API key"
    if key_info["status"] != "active":
        return None, 401, "API key is inactive"
    user_id = key_info["user_id"]
    api_key_id = key_info["id"]
    user_balance = key_info["balance"]

    # 2. 获取模型价格
    price = admin_service.get_model_price(model)
    if not price:
        return None, 422, f"Model '{model}' not found or disabled"

    # 3. 估算费用并检查余额
    estimated_cost = estimate_cost(model, messages)
    if user_balance < estimated_cost:
        return None, 402, "Insufficient balance"

    # 4. 路由到 provider
    provider = get_provider(model)
    if not provider:
        return None, 422, f"Provider for model '{model}' not configured"

    platform_key = select_platform_key(provider)
    if not platform_key:
        return None, 503, "No available platform key for this provider"

    base_url = platform_key["base_url"] or PROVIDER_BASE_URL.get(provider, "")
    upstream_url = f"{base_url}/chat/completions"

    # 5. 构建上游请求头
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {platform_key['key_token']}"}
    if provider == "anthropic":
        # Anthropic 需要不同的 header
        headers["x-api-key"] = headers.pop("Authorization", "").replace("Bearer ", "")
        headers["anthropic-version"] = "2023-06-01"
        # Anthropic 不支持 chat/completions，改用 messages API
        upstream_url = f"{base_url}/messages"
        upstream_data = {
            "model": model,
            "messages": messages,
            "max_tokens": request_data.get("max_tokens", 1024),
        }
        if "temperature" in request_data:
            upstream_data["temperature"] = request_data["temperature"]
    else:
        upstream_data = request_data

    # 6. 转发请求
    request_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
    try:
        resp = requests.post(upstream_url, json=upstream_data, headers=headers, timeout=60)
    except requests.exceptions.Timeout:
        return None, 504, "Upstream request timeout"
    except requests.exceptions.RequestException as e:
        return None, 502, f"Upstream request failed: {str(e)}"

    # 7. 解析上游响应
    if resp.status_code != 200:
        refund_balance(user_id, estimated_cost)
        return None, 502, f"Upstream error: {resp.text[:200]}"

    upstream_json = resp.json()

    # 8. 提取 usage 并计算实际费用
    usage = upstream_json.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    input_cost = input_tokens / 1000 * price["price_per_1k_input"]
    output_cost = output_tokens / 1000 * price["price_per_1k_output"]
    actual_cost = round(input_cost + output_cost, 6)

    # 9. 实际扣费
    if not deduct_balance(user_id, actual_cost):
        refund_balance(user_id, estimated_cost)
        return None, 402, "Balance deduction failed"

    # 10. 记录用量
    record_usage(user_id, api_key_id, model, input_tokens, output_tokens, actual_cost, request_id)

    # 11. 附加 request_id 并返回
    upstream_json["id"] = request_id
    return upstream_json, 200, ""
```

- [ ] **Step 2: 编写聊天路由（复制以下完整代码）**

```python
"""聊天代理路由（OpenAI 兼容）"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import extract_token_from_header, verify_token
from services import proxy_service

chat_bp = Blueprint("chat", __name__, url_prefix="/v1")


@chat_bp.route("/chat/completions", methods=["POST"])
def chat_completions():
    """OpenAI 兼容的聊天补全接口"""
    # 从 Authorization: Bearer <token> 提取 Key
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": {"message": "Missing or invalid Authorization header", "type": "invalid_request_error"}}), 401
    bearer_token = auth_header[7:]

    if not request.is_json:
        return jsonify({"error": {"message": "Request body must be JSON", "type": "invalid_request_error"}}), 400

    request_data = request.get_json()

    result, status_code, error = proxy_service.proxy_chat_request(bearer_token, request_data)

    if error:
        return jsonify({"error": {"message": error, "type": "invalid_request_error"}}), status_code

    return jsonify(result), 200


@chat_bp.route("/models", methods=["GET"])
def list_models():
    """返回可用模型列表"""
    from services import admin_service
    prices = admin_service.get_model_prices()
    data = [
        {
            "id": p["model"],
            "object": "model",
            "owned_by": p["provider"],
            "permission": [],
            "root": p["model"],
        }
        for p in prices if p.get("enabled", True)
    ]
    return jsonify({"object": "list", "data": data}), 200
```

- [ ] **Step 3: 编写用量服务（复制以下完整代码）**

```python
"""用量查询服务"""
from data.database import get_cursor
from datetime import datetime, timedelta


def get_usage_by_user(user_id: int, days: int = 30) -> dict:
    """获取用户用量统计"""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) as total_requests,
                   COALESCE(SUM(input_tokens), 0) as total_input_tokens,
                   COALESCE(SUM(output_tokens), 0) as total_output_tokens,
                   COALESCE(SUM(cost), 0) as total_cost
            FROM usage_log
            WHERE user_id = ? AND request_time >= ?
        """, (user_id, since))
        row = cursor.fetchone()
        return dict(row)


def get_usage_by_model(user_id: int, days: int = 30) -> list[dict]:
    """按模型分组统计用量"""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT model,
                   COUNT(*) as requests,
                   COALESCE(SUM(input_tokens), 0) as input_tokens,
                   COALESCE(SUM(output_tokens), 0) as output_tokens,
                   COALESCE(SUM(cost), 0) as cost
            FROM usage_log
            WHERE user_id = ? AND request_time >= ?
            GROUP BY model
            ORDER BY cost DESC
        """, (user_id, since))
        return [dict(row) for row in cursor.fetchall()]
```

- [ ] **Step 4: 编写用量路由（复制以下完整代码）**

```python
"""用量查询路由"""
from flask import Blueprint, jsonify, request
from utils.jwt_util import verify_token, extract_token_from_header

usage_bp = Blueprint("usage", __name__, url_prefix="/v1")


def require_auth():
    token = extract_token_from_header(request.headers.get("Authorization"))
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    return payload["user_id"], None, None


@usage_bp.route("/account/usage", methods=["GET"])
def account_usage():
    """获取当前用户用量统计（OpenAI 兼容路径）"""
    user_id, err, status = require_auth()
    if err:
        return err, status
    days = int(__import__("flask", fromlist=["request"]).request.args.get("days", 30))
    summary = __import__("services.usage_service", fromlist=["get_usage_by_user"]).get_usage_by_user(user_id, days)
    by_model = __import__("services.usage_service", fromlist=["get_usage_by_model"]).get_usage_by_model(user_id, days)
    return jsonify({
        "success": True,
        "data": {
            "period": f"last_{days}_days",
            "summary": summary,
            "by_model": by_model,
        }
    }), 200
```

- [ ] **Step 5: Commit**

```bash
cd D:/NetWork && git add backend/services/proxy_service.py backend/routes/chat_routes.py backend/services/usage_service.py backend/routes/usage_routes.py && git commit -m "feat(backend): add chat proxy (core), usage tracking and routes"
```

---

## Task 9: 主入口 — ai_hub_backend.py

**Files:**
- Create: `backend/ai_hub_backend.py`

- [ ] **Step 1: 编写主入口（复制以下完整代码）**

```python
#!/usr/bin/env python3
"""AI API 中转平台 — 后端网关主入口"""
from flask import Flask, jsonify
from data.database import init_db

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False


def register_blueprints():
    """注册所有蓝图"""
    from routes.auth_routes import auth_bp
    from routes.key_routes import key_bp
    from routes.chat_routes import chat_bp
    from routes.admin_routes import admin_bp
    from routes.usage_routes import usage_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(key_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(usage_bp)


@app.route("/health", methods=["GET"])
def health():
    """健康检查"""
    return jsonify({"status": "ok", "service": "aihubs-backend"}), 200


@app.after_request
def add_cors(response):
    """允许跨域（开发环境）"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Registering blueprints...")
    register_blueprints()
    print("Starting server on http://localhost:8080")
    print("Default admin: admin@aihubs.com / admin123")
    app.run(host="0.0.0.0", port=8080, debug=True)
```

- [ ] **Step 2: Commit**

```bash
cd D:/NetWork && git add backend/ai_hub_backend.py && git commit -m "feat(backend): add main entry point - Flask server startup"
```

---

## Task 10: 端到端测试验证

**Files:**
- Create: `backend/test_api.py`

- [ ] **Step 1: 编写测试脚本（复制以下完整代码）**

```python
#!/usr/bin/env python3
"""API 端到端测试（pytest）"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from ai_hub_backend import app
from data.database import init_db, get_connection


@pytest.fixture
def client():
    """Flask 测试客户端"""
    app.config["TESTING"] = True
    with app.test_client() as client:
        with app.app_context():
            init_db()  # 使用内存数据库测试
        yield client


@pytest.fixture
def auth_token(client):
    """注册并获取 JWT Token"""
    # 注册
    rv = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "test123456"
    })
    assert rv.status_code == 200, rv.get_json()
    # 登录
    rv = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "test123456"
    })
    assert rv.status_code == 200
    data = rv.get_json()
    return data["data"]["token"]


def test_health(client):
    """健康检查"""
    rv = client.get("/health")
    assert rv.status_code == 200
    assert rv.get_json()["status"] == "ok"


def test_register(client):
    """注册接口"""
    rv = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert rv.status_code == 200
    assert rv.get_json()["success"] is True


def test_register_duplicate(client):
    """重复注册"""
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass"})
    rv = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass"})
    assert rv.status_code == 400


def test_login(client):
    """登录接口"""
    client.post("/api/auth/register", json={"email": "login@example.com", "password": "pass"})
    rv = client.post("/api/auth/login", json={"email": "login@example.com", "password": "pass"})
    assert rv.status_code == 200
    data = rv.get_json()
    assert "token" in data["data"]


def test_create_and_list_keys(client, auth_token):
    """创建和列举 Key"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    rv = client.post("/api/keys", json={"name": "Test Key"}, headers=headers)
    assert rv.status_code == 201
    key_data = rv.get_json()["data"]
    assert key_data["token"].startswith("sk-aihub-")

    rv = client.get("/api/keys", headers=headers)
    assert rv.status_code == 200
    assert len(rv.get_json()["data"]) >= 1


def test_list_models(client):
    """模型列表"""
    rv = client.get("/v1/models")
    assert rv.status_code == 200
    data = rv.get_json()
    assert data["object"] == "list"
    model_ids = [m["id"] for m in data["data"]]
    assert "gpt-4o" in model_ids


def test_proxy_without_key(client):
    """无 Key 访问代理应返回 401"""
    rv = client.post("/v1/chat/completions", json={
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "hi"}]
    })
    assert rv.status_code == 401


def test_proxy_insufficient_balance(client, auth_token):
    """余额不足应返回 402（无可用平台 Key 时返回 503）"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    rv = client.post("/v1/chat/completions",
                     headers=headers,
                     json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]})
    # 预期：没有配置平台 Key，返回 503
    assert rv.status_code in [402, 503]
```

- [ ] **Step 2: 运行测试**

```bash
cd D:/NetWork/backend && pip install pytest && python -m pytest test_api.py -v
```

- [ ] **Step 3: Commit**

```bash
cd D:/NetWork && git add backend/test_api.py && git commit -m "test(backend): add API integration tests"
```

---

## 实施顺序

| # | 任务 | 预计时间 |
|---|------|---------|
| 1 | 项目初始化（目录/依赖/Python 环境） | ~5 分钟 |
| 2 | 数据模型 | ~3 分钟 |
| 3 | 数据库层 | ~5 分钟 |
| 4 | 工具类（JWT + BCrypt） | ~3 分钟 |
| 5 | 认证服务与路由 | ~5 分钟 |
| 6 | API Key 管理 | ~5 分钟 |
| 7 | 管理员服务与路由 | ~5 分钟 |
| 8 | 聊天代理（核心） | ~15 分钟 |
| 9 | 主入口 | ~3 分钟 |
| 10 | 测试验证 | ~5 分钟 |
| **总计** | | **~54 分钟** |

---

## 依赖信息

| 依赖 | 安装命令 | 说明 |
|------|---------|------|
| Flask | `pip install flask` | Web 框架 |
| PyJWT | `pip install pyjwt` | JWT 签发/验证 |
| Passlib+BCrypt | `pip install passlib bcrypt` | 密码哈希 |
| Requests | `pip install requests` | 上游 API 调用 |
| Pytest | `pip install pytest` | 测试框架 |

> Windows 环境无需额外安装编译器（bcrypt 有预编译 wheel），Python 3.8+ 推荐。

---

## 自查清单（实施前请确认）

- [ ] Python 3.8+ 已安装：`python --version`
- [ ] pip 可用：`pip --version`
- [ ] 后端目录干净（无旧文件残留）
- [ ] 设计文档已阅读：`docs/superpowers/specs/2026-04-16-backend-api-gateway-design.md`
