# Python → Node.js (Cloudflare Workers) 迁移设计方案

## 1. 背景与目标

将现有 Python Flask 后端迁移到 Cloudflare Workers + Hono + TypeScript，实现：
- 前后端统一部署到 Cloudflare 全球边缘网络
- 保留所有现有功能（地区路由、API Key 管理、用量统计等）
- 零维护服务器，享用免费额度

---

## 2. 技术选型

| 组件 | 旧方案 | 新方案 |
|------|--------|--------|
| 运行时 | Python 3 | Cloudflare Workers (V8) |
| 后端框架 | Flask | **Hono** |
| 语言 | Python | **TypeScript** |
| 数据库 | SQLite | **Cloudflare D1** |
| 认证 | JWT + BCrypt | **jose (JWT) + bcryptjs** |
| 前端代理 | 同域 Nginx | Cloudflare Pages → Worker |

**选型理由：**
- **Hono**：Cloudflare Workers 生态最轻量的框架，API 与 Express 相似，V8 Isolates 兼容性好
- **D1**：SQLite 兼容 API，零成本迁移，数据在 Cloudflare 全球复制
- **jose + bcryptjs**：标准 Web Crypto API 实现，无 Node.js 特有依赖

---

## 3. 项目结构

```
NetWork/
├── frontend/               # 静态文件（不变）
│   ├── landing.html
│   ├── login.html
│   ├── dashboard.html
│   ├── api-keys.html
│   └── assets/
├── worker/                # 新建：Cloudflare Worker 后端
│   ├── src/
│   │   ├── index.ts       # 入口，Hono app 挂载
│   │   ├── routes/
│   │   │   ├── auth.ts    # 登录 / 注册 / 登出
│   │   │   ├── keys.ts     # API Key CRUD
│   │   │   ├── chat.ts     # 聊天补全代理（含地区路由）
│   │   │   ├── user.ts     # 用户资料 / 地区修改
│   │   │   └── usage.ts    # 用量统计
│   │   ├── services/
│   │   │   ├── proxy.ts    # 上游转发 + 地区路由
│   │   │   ├── jwt.ts      # JWT 签发/验证
│   │   │   ├── hash.ts     # BCrypt 哈希
│   │   │   └── region.ts   # IP 归属地探测
│   │   ├── db/
│   │   │   └── index.ts    # D1 客户端 + 初始化
│   │   └── types.ts        # 共享类型定义
│   ├── schema.sql          # D1 建表 SQL
│   ├── wrangler.toml       # Worker 配置（D1 + KV binding）
│   └── tsconfig.json
└── _redirects              # Cloudflare Pages 路由规则
```

---

## 4. 数据库设计（D1）

### 4.1 表结构

```sql
CREATE TABLE IF NOT EXISTS user (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    balance    REAL    DEFAULT 0,
    role       TEXT    DEFAULT 'user',
    region     TEXT,                       -- CN / OVERSEAS / NULL
    created_at TEXT    DEFAULT (datetime('now')),
    updated_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_key (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    key_name  TEXT,
    token     TEXT    UNIQUE NOT NULL,
    status    TEXT    DEFAULT 'active',
    created_at TEXT   DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS platform_key (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    provider  TEXT    NOT NULL,
    key_token TEXT    NOT NULL,
    base_url  TEXT,
    region    TEXT    DEFAULT 'GLOBAL',  -- CN / OVERSEAS / GLOBAL
    status    TEXT    DEFAULT 'active',
    created_at TEXT   DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS model_price (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    model             TEXT    UNIQUE NOT NULL,
    provider          TEXT    NOT NULL,
    price_per_1k_input  REAL NOT NULL,
    price_per_1k_output REAL NOT NULL,
    enabled           INTEGER  DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usage_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    api_key_id   INTEGER NOT NULL,
    model        TEXT    NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost         REAL    DEFAULT 0,
    request_time TEXT    DEFAULT (datetime('now')),
    request_id   TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (api_key_id) REFERENCES api_key(id)
);
```

### 4.2 D1 初始化

首次部署时通过 `wrangler d1 execute` 执行 `schema.sql`。

---

## 5. 认证设计

### 5.1 Cookie 方案

- Worker 生成 HttpOnly Cookie（含 JWT）
- Cookie 名：`token`，有效期 7 天
- 跨域：Pages 代理同域，`credentials: 'include'` 正常工作

### 5.2 JWT Payload

```typescript
interface JWTPayload {
  sub: number;      // user_id
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

---

## 6. 地区路由逻辑

与 Python 版保持一致：

```
proxy_chat_request(token, requestData, env)
  │
  ├─ 1. 验证 API Key → 获取 user_id, balance, region
  │
  ├─ 2. region 未配置？
  │     ├─ 是 → ip_to_region(clientIP) → 写入 D1
  │     └─ 否 → 继续
  │
  ├─ 3. 估算费用 & 检查余额
  │
  ├─ 4. get_provider(model) → provider
  │
  ├─ 5. get_platform_keys_by_provider(provider, region)
  │     └─ 精确匹配 region > GLOBAL 降级
  │
  ├─ 6. 转发到对应 API（OpenAI / Anthropic / DeepSeek 等）
  │
  ├─ 7. 扣费 & 记录 usage_log
  │
  └─ 8. 返回上游响应
```

---

## 7. IP 归属地探测

```typescript
export async function ipToRegion(ip: string): Promise<'CN' | 'OVERSEAS'> {
  // 1. 本地 ip2region.xdb 二分查找（打包到 Worker assets）
  // 2. 降级：HTTP API 查询
  // 3. 默认返回 OVERSEAS
}
```

> Cloudflare Workers 可通过 `env.ASSETS.fetch()` 或 KV 存储 ip2region 数据文件。

---

## 8. 部署架构

```
用户浏览器
    │
    ▼
Cloudflare Pages (静态文件 + /api/* 代理)
    │
    ▼
Cloudflare Worker (Hono 后端)
    │
    ├── D1 (aihubs-db) — 用户数据
    ├── KV (aihubs-kv) — 可选缓存
    └── 外部 API — OpenAI / Anthropic / DeepSeek 等
```

### 部署步骤

```bash
# 1. 创建 D1 数据库
wrangler d1 create aihubs-db

# 2. 初始化表结构（将 database_uuid 填入 wrangler.toml）
wrangler d1 execute aihubs-db --file=./schema.sql

# 3. 部署 Worker
wrangler deploy

# 4. Cloudflare Pages 后台：
#    - 绑定 Worker
#    - 配置路由规则：/api/* → Worker
```

---

## 9. 前端改动

- `assets/api.js` 中的 `BASE` 保持 `''`（同域代理）
- Pages 部署时 `_redirects` 文件配置：

```
/api/*  https://aihubs-worker.workers.dev/api/*  200
```

---

## 10. 错误处理

| 场景 | HTTP 状态码 | 错误消息 |
|------|------------|---------|
| IP 探测失败 | 400 | `Region detection failed` |
| 地区无可用 Key | 503 | `No available platform key for this region` |
| 余额不足 | 402 | `Insufficient balance` |
| 代理超时 | 504 | `Upstream request timeout` |

---

## 11. 迁移原则

1. **功能等价**：Python 版的每个 API 端点都有对应的 TypeScript 实现
2. **渐进迁移**：先迁移 Worker，后端 API 一致后再切前端
3. **零停机**：新旧版本并行，验证通过后再切换
4. **类型安全**：TypeScript 全程严格类型，无 `any`
