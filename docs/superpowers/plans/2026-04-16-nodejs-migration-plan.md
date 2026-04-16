# Python → Node.js Cloudflare Workers 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Python Flask 后端完整迁移到 Cloudflare Workers (Hono + TypeScript)，保留所有功能（地区路由、API Key 管理、聊天代理、用量统计）。

**Architecture:** Hono 框架挂载所有路由，Cloudflare D1 作为数据库，jose + bcryptjs 实现认证，Pages 代理同域请求到 Worker。

**Tech Stack:** TypeScript / Hono / Cloudflare Workers / D1 / jose / bcryptjs / Wrangler

---

## 文件变更总览

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 创建 | `worker/` | 新建 Worker 项目目录 |
| 创建 | `worker/src/types.ts` | 共享类型定义 |
| 创建 | `worker/src/db/index.ts` | D1 客户端封装 |
| 创建 | `worker/schema.sql` | D1 建表 SQL |
| 创建 | `worker/wrangler.toml` | Worker 配置 |
| 创建 | `worker/tsconfig.json` | TypeScript 配置 |
| 创建 | `worker/src/services/jwt.ts` | JWT 签发/验证 |
| 创建 | `worker/src/services/hash.ts` | BCrypt 哈希 |
| 创建 | `worker/src/services/region.ts` | IP 归属地探测 |
| 创建 | `worker/src/services/proxy.ts` | 上游代理 + 地区路由 |
| 创建 | `worker/src/routes/auth.ts` | 登录/注册/登出 |
| 创建 | `worker/src/routes/keys.ts` | API Key CRUD |
| 创建 | `worker/src/routes/chat.ts` | 聊天补全 |
| 创建 | `worker/src/routes/user.ts` | 用户资料/地区修改 |
| 创建 | `worker/src/routes/usage.ts` | 用量统计 |
| 创建 | `worker/src/routes/admin.ts` | 管理员接口 |
| 创建 | `worker/src/index.ts` | 入口，Hono app |
| 创建 | `_redirects` | Pages 路由规则 |

---

## Task 1: 初始化 Worker 项目骨架

**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`
- Create: `worker/.gitignore`

- [ ] **Step 1: 创建 `worker/package.json`**

```json
{
  "name": "aihubs-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.6.0",
    "jose": "^5.9.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "wrangler": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 `worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noImplicitAny": true,
    "types": ["@cloudflare/workers-types"],
    "lib": ["ES2022"]
  },
  "include": ["src/**/*", "*.ts"]
}
```

- [ ] **Step 3: 创建 `worker/wrangler.toml`**

```toml
name = "aihubs-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 数据库绑定（创建后替换 DATABASE_ID）
[[d1_databases]]
binding = "DB"
database_name = "aihubs-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

- [ ] **Step 4: 创建 `worker/.gitignore`**

```
node_modules/
dist/
.wrangler/
.dev.vars
```

- [ ] **Step 5: 安装依赖**

```bash
cd worker && npm install
```

- [ ] **Step 6: 提交**

```bash
git add worker/
git commit -m "feat(worker): scaffold Cloudflare Worker project with Hono"
```

---

## Task 2: 类型定义与 D1 数据库层

**Files:**
- Create: `worker/src/types.ts`
- Create: `worker/schema.sql`
- Create: `worker/src/db/index.ts`

### 2.1 类型定义

- [ ] **Step 1: 创建 `worker/src/types.ts`**

```typescript
// ---- 用户相关 ----
export interface User {
  id: number;
  email: string;
  password: string;
  balance: number;
  role: string;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: number;
  email: string;
  balance: number;
  role: string;
  region: string | null;
}

// ---- API Key ----
export interface ApiKey {
  id: number;
  user_id: number;
  key_name: string;
  token: string;
  status: string;
  created_at: string;
}

// ---- 平台 Key ----
export interface PlatformKey {
  id: number;
  provider: string;
  key_token: string;
  base_url: string | null;
  region: string;
  status: string;
}

// ---- 模型价格 ----
export interface ModelPrice {
  id: number;
  model: string;
  provider: string;
  price_per_1k_input: number;
  price_per_1k_output: number;
  enabled: number;
}

// ---- 用量日志 ----
export interface UsageLog {
  id: number;
  user_id: number;
  api_key_id: number;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  request_time: string;
  request_id: string;
}

// ---- 地区 ----
export type Region = 'CN' | 'OVERSEAS';

// ---- 路由上下文 ----
export interface Variables {
  user?: SafeUser;
}
```

### 2.2 D1 Schema

- [ ] **Step 2: 创建 `worker/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS user (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    balance    REAL    DEFAULT 0,
    role       TEXT    DEFAULT 'user',
    region     TEXT,
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
    region    TEXT    DEFAULT 'GLOBAL',
    status    TEXT    DEFAULT 'active',
    created_at TEXT   DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS model_price (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    model               TEXT    UNIQUE NOT NULL,
    provider            TEXT    NOT NULL,
    price_per_1k_input  REAL    NOT NULL,
    price_per_1k_output REAL    NOT NULL,
    enabled             INTEGER  DEFAULT 1
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

### 2.3 D1 客户端

- [ ] **Step 3: 创建 `worker/src/db/index.ts`**

```typescript
import { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
}

export async function query<T>(
  db: D1Database,
  sql: string,
  ...params: (string | number | null)[]
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const result = params.length > 0 ? stmt.bind(...params) : stmt;
  const { results } = await result.all();
  return results as T[];
}

export async function queryOne<T>(
  db: D1Database,
  sql: string,
  ...params: (string | number | null)[]
): Promise<T | null> {
  const rows = await query<T>(db, sql, ...params);
  return rows[0] ?? null;
}

export async function execute(
  db: D1Database,
  sql: string,
  ...params: (string | number | null)[]
): Promise<{ changes: number; lastInsertRowid: number }> {
  const stmt = db.prepare(sql);
  const result = params.length > 0 ? stmt.bind(...params) : stmt;
  const info = await result.run();
  return {
    changes: db_changes(info),
    lastInsertRowid: Number(db_last_rowid(info)),
  };
}

// D1 的 info 对象的 changes 和 lastRowId 访问方式
function db_changes(info: D1Result<unknown>): number {
  return (info as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
}
function db_last_rowid(info: D1Result<unknown>): number {
  return (info as unknown as { meta?: { last_row_id?: number } }).meta?.last_row_id ?? 0;
}
```

- [ ] **Step 4: 提交**

```bash
git add worker/src/types.ts worker/schema.sql worker/src/db/index.ts
git commit -m "feat(worker): add types, D1 schema, and database client"
```

---

## Task 3: 认证服务（JWT + BCrypt）

**Files:**
- Create: `worker/src/services/jwt.ts`
- Create: `worker/src/services/hash.ts`

- [ ] **Step 1: 创建 `worker/src/services/hash.ts`**

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 2: 创建 `worker/src/services/jwt.ts`**

```typescript
import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

const SECRET = new TextEncoder().encode(
  // 在生产环境中应使用环境变量，此处用固定密钥（Cloudflare Worker 环境下建议配合 KV 存储）
  'aihubs-super-secret-key-change-in-production'
);
const COOKIE_NAME = 'token';
const EXPIRY = '7d';

export interface JWTPayload extends JoseJWTPayload {
  sub: number;   // user_id
  email: string;
  role: string;
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as JoseJWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getExpiryDays(): number {
  return 7;
}
```

- [ ] **Step 3: 提交**

```bash
git add worker/src/services/hash.ts worker/src/services/jwt.ts
git commit -m "feat(worker): add JWT and BCrypt auth services"
```

---

## Task 4: IP 归属地探测

**Files:**
- Create: `worker/src/services/region.ts`

- [ ] **Step 1: 创建 `worker/src/services/region.ts`**

```typescript
// IP 归属地探测：HTTP API 方式
// Cloudflare Workers 无法访问本地文件系统，使用 HTTP API 查询

const IP_API_URL = 'http://ip-api.com/json';

export async function ipToRegion(ip: string): Promise<'CN' | 'OVERSEAS'> {
  // 跳过本地/内网 IP
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'OVERSEAS';
  }

  try {
    const url = `${IP_API_URL}/${ip}?fields=countryCode`;
    const res = await fetch(url, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!res.ok) return 'OVERSEAS';
    const data = await res.json<{ countryCode: string }>();
    if (data.countryCode === 'CN') return 'CN';
    return 'OVERSEAS';
  } catch {
    return 'OVERSEAS';
  }
}

export function getClientIP(request: Request): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/services/region.ts
git commit -m "feat(worker): add IP region detection service"
```

---

## Task 5: 认证路由（登录/注册/登出）

**Files:**
- Create: `worker/src/routes/auth.ts`

- [ ] **Step 1: 创建 `worker/src/routes/auth.ts`**

```typescript
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { signToken, verifyToken, getCookieName, getExpiryDays } from '../services/jwt';
import { hashPassword, verifyPassword } from '../services/hash';
import type { SafeUser } from '../types';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
auth.post('/register', async (c) => {
  const { email, password, region } = await c.req.json<{
    email?: string;
    password?: string;
    region?: string;
  }>();

  if (!email || !password) {
    return c.json({ success: false, message: '邮箱和密码不能为空' }, 400);
  }
  if (password.length < 6) {
    return c.json({ success: false, message: '密码长度不能少于6位' }, 400);
  }

  const existing = await queryOne<{ id: number }>(c.env.DB, 'SELECT id FROM user WHERE email = ?', email);
  if (existing) {
    return c.json({ success: false, message: '该邮箱已注册' }, 400);
  }

  const hashed = await hashPassword(password);
  const regionValue = region === 'CN' || region === 'OVERSEAS' ? region : null;

  await execute(
    c.env.DB,
    'INSERT INTO user (email, password, balance, region) VALUES (?, ?, ?, ?)',
    email,
    hashed,
    10.0,
    regionValue
  );

  return c.json({ success: true, message: '注册成功' }, 200);
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();

  const user = await queryOne<{ id: number; email: string; password: string; balance: number; role: string; region: string | null }>(
    c.env.DB,
    'SELECT * FROM user WHERE email = ?',
    email
  );

  if (!user || !(await verifyPassword(password ?? '', user.password))) {
    return c.json({ success: false, message: '邮箱或密码错误' }, 401);
  }

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });

  setCookie(c, getCookieName(), token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: getExpiryDays() * 24 * 60 * 60,
  });

  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    balance: user.balance,
    role: user.role,
    region: user.region,
  };

  return c.json({ success: true, data: { user: safeUser } }, 200);
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  deleteCookie(c, getCookieName());
  return c.json({ success: true, message: '已退出登录' }, 200);
});

export { auth };
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/routes/auth.ts
git commit -m "feat(worker): add auth routes (register/login/logout)"
```

---

## Task 6: API Key 路由

**Files:**
- Create: `worker/src/routes/keys.ts`

- [ ] **Step 1: 创建 `worker/src/routes/keys.ts`**

```typescript
import { Hono } from 'hono';
import { query, queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import type { ApiKey, SafeUser } from '../types';

const keys = new Hono<{ Bindings: Env }>();

async function requireAuth(c: any): Promise<SafeUser | null> {
  const token = getCookie(c, getCookieName());
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await queryOne<SafeUser>(
    c.env.DB,
    'SELECT id, email, balance, role, region FROM user WHERE id = ?',
    payload.sub
  );
  return user;
}

function randomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk-aihub-';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (const b of array) result += chars[b % chars.length];
  return result;
}

// GET /api/keys
keys.get('/', async (c) => {
  const user = await requireAuth(c);
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const rows = await query<ApiKey>(
    c.env.DB,
    'SELECT id, user_id, key_name, token, status, created_at FROM api_key WHERE user_id = ?',
    user.id
  );

  return c.json({ success: true, data: rows }, 200);
});

// POST /api/keys
keys.post('/', async (c) => {
  const user = await requireAuth(c);
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const { name } = await c.req.json<{ name?: string }>();
  const token = randomKey();

  const info = await execute(
    c.env.DB,
    'INSERT INTO api_key (user_id, key_name, token) VALUES (?, ?, ?)',
    user.id,
    name ?? '默认 Key',
    token
  );

  const row = await queryOne<ApiKey>(
    c.env.DB,
    'SELECT * FROM api_key WHERE id = ?',
    info.lastInsertRowid
  );

  return c.json({ success: true, data: row }, 200);
});

// DELETE /api/keys/:id
keys.delete('/:id', async (c) => {
  const user = await requireAuth(c);
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const keyId = Number(c.req.param('id'));
  const info = await execute(
    c.env.DB,
    "UPDATE api_key SET status = 'revoked' WHERE id = ? AND user_id = ? AND status = 'active'",
    keyId,
    user.id
  );

  if (info.changes === 0) {
    return c.json({ success: false, message: 'Key not found or already revoked' }, 404);
  }
  return c.json({ success: true, message: 'Key revoked' }, 200);
});

export { keys };
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/routes/keys.ts
git commit -m "feat(worker): add API key management routes"
```

---

## Task 7: 用户资料路由

**Files:**
- Create: `worker/src/routes/user.ts`

- [ ] **Step 1: 创建 `worker/src/routes/user.ts`**

```typescript
import { Hono } from 'hono';
import { queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import { getClientIP, ipToRegion } from '../services/region';
import type { SafeUser } from '../types';

const user = new Hono<{ Bindings: Env }>();

async function requireAuth(c: any): Promise<SafeUser | null> {
  const token = getCookie(c, getCookieName());
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return queryOne<SafeUser>(
    c.env.DB,
    'SELECT id, email, balance, role, region FROM user WHERE id = ?',
    payload.sub
  );
}

// GET /api/user/me
user.get('/me', async (c) => {
  const userRecord = await requireAuth(c);
  if (!userRecord) return c.json({ success: false, message: 'Unauthorized' }, 401);
  return c.json({ success: true, data: userRecord }, 200);
});

// PUT /api/user/region
user.put('/region', async (c) => {
  const currentUser = await requireAuth(c);
  if (!currentUser) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const { region } = await c.req.json<{ region?: string }>();
  if (region !== 'CN' && region !== 'OVERSEAS') {
    return c.json({ success: false, message: 'Invalid region value' }, 400);
  }

  await execute(c.env.DB, 'UPDATE user SET region = ? WHERE id = ?', region, currentUser.id);
  return c.json({ success: true, message: 'Region updated' }, 200);
});

export { user };
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/routes/user.ts
git commit -m "feat(worker): add user profile and region update routes"
```

---

## Task 8: 用量统计路由

**Files:**
- Create: `worker/src/routes/usage.ts`

- [ ] **Step 1: 创建 `worker/src/routes/usage.ts`**

```typescript
import { Hono } from 'hono';
import { query } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import type { UsageLog } from '../types';

const usage = new Hono<{ Bindings: Env }>();

async function getUserId(c: any): Promise<number | null> {
  const token = getCookie(c, getCookieName());
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.sub ?? null;
}

// GET /v1/account/usage?days=30
usage.get('/v1/account/usage', async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const days = Number(c.req.query('days') ?? '30');

  const logs = await query<UsageLog>(
    c.env.DB,
    `SELECT * FROM usage_log
     WHERE user_id = ? AND request_time >= datetime('now', '-${days} days')
     ORDER BY request_time DESC`,
    userId
  );

  const totalInput = logs.reduce((s, l) => s + l.input_tokens, 0);
  const totalOutput = logs.reduce((s, l) => s + l.output_tokens, 0);
  const totalCost = logs.reduce((s, l) => s + l.cost, 0);
  const requestCount = logs.length;

  return c.json({
    success: true,
    data: {
      logs,
      summary: { totalInput, totalOutput, totalCost, requestCount },
    },
  }, 200);
});

export { usage };
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/routes/usage.ts
git commit -m "feat(worker): add usage statistics routes"
```

---

## Task 9: 管理员路由

**Files:**
- Create: `worker/src/routes/admin.ts`

- [ ] **Step 1: 创建 `worker/src/routes/admin.ts`**

```typescript
import { Hono } from 'hono';
import { query, queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';

const admin = new Hono<{ Bindings: Env }>();

async function requireAdmin(c: any): Promise<boolean> {
  const token = getCookie(c, getCookieName());
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}

// GET /api/admin/users
admin.get('/users', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const rows = await query(c.env.DB, 'SELECT id, email, balance, role, region, created_at FROM user ORDER BY id');
  return c.json({ success: true, data: rows }, 200);
});

// POST /api/admin/recharge
admin.post('/recharge', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const { userId, amount } = await c.req.json<{ userId?: number; amount?: number }>();
  if (!userId || !amount || amount <= 0) return c.json({ success: false, message: 'Invalid params' }, 400);
  await execute(c.env.DB, 'UPDATE user SET balance = balance + ? WHERE id = ?', amount, userId);
  return c.json({ success: true, message: 'Recharged' }, 200);
});

// GET /api/admin/platform-keys
admin.get('/platform-keys', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const rows = await query(c.env.DB, 'SELECT * FROM platform_key ORDER BY id');
  return c.json({ success: true, data: rows }, 200);
});

// POST /api/admin/platform-keys
admin.post('/platform-keys', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const { provider, key_token, base_url, region } = await c.req.json();
  const info = await execute(
    c.env.DB,
    'INSERT INTO platform_key (provider, key_token, base_url, region) VALUES (?, ?, ?, ?)',
    provider, key_token, base_url ?? null, region ?? 'GLOBAL'
  );
  const row = await queryOne(c.env.DB, 'SELECT * FROM platform_key WHERE id = ?', info.lastInsertRowid);
  return c.json({ success: true, data: row }, 200);
});

// DELETE /api/admin/platform-keys/:id
admin.delete('/platform-keys/:id', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const id = Number(c.req.param('id'));
  await execute(c.env.DB, 'DELETE FROM platform_key WHERE id = ?', id);
  return c.json({ success: true, message: 'Deleted' }, 200);
});

export { admin };
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/routes/admin.ts
git commit -m "feat(worker): add admin management routes"
```

---

## Task 10: 聊天代理路由（核心地区路由）

**Files:**
- Create: `worker/src/services/proxy.ts`
- Create: `worker/src/routes/chat.ts`

### 10.1 Provider 配置

- [ ] **Step 1: 创建 `worker/src/services/proxy.ts`**

```typescript
import type { PlatformKey, ModelPrice } from '../types';

export const PROVIDER_MAP: Record<string, string> = {
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-4': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-sonnet-4-6': 'anthropic',
  'claude-3-opus': 'anthropic',
  'claude-3-sonnet': 'anthropic',
  'deepseek-chat': 'deepseek',
  'deepseek-coder': 'deepseek',
  'gemini-1.5-pro': 'google',
  'gemini-1.5-flash': 'google',
  'gemini-pro': 'google',
  'moonshot-v1-8k': 'moonshot',
  'moonshot-v1-32k': 'moonshot',
  'glm-4': 'zhipu',
  'glm-4v': 'zhipu',
  'qwen-plus': 'alibaba',
  'qwen-turbo': 'alibaba',
};

export const PROVIDER_BASE_URL: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  moonshot: 'https://api.moonshot.cn/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

export function getProvider(model: string): string | null {
  return PROVIDER_MAP[model] ?? null;
}

export async function selectPlatformKey(
  db: D1Database,
  provider: string,
  region: string
): Promise<PlatformKey | null> {
  // 1. 精确匹配
  const exact = await db
    .prepare('SELECT * FROM platform_key WHERE provider = ? AND region = ? AND status = ? LIMIT 1')
    .bind(provider, region, 'active')
    .first<PlatformKey>();
  if (exact) return exact;

  // 2. GLOBAL 降级
  return db
    .prepare('SELECT * FROM platform_key WHERE provider = ? AND region = ? AND status = ? LIMIT 1')
    .bind(provider, 'GLOBAL', 'active')
    .first<PlatformKey>();
}

export async function getModelPrice(db: D1Database, model: string): Promise<ModelPrice | null> {
  return db
    .prepare('SELECT * FROM model_price WHERE model = ? AND enabled = 1 LIMIT 1')
    .first<ModelPrice>();
}

export async function deductBalance(db: D1Database, userId: number, cost: number): Promise<boolean> {
  const result = await db
    .prepare('UPDATE user SET balance = balance - ? WHERE id = ? AND balance >= ?')
    .bind(cost, userId, cost)
    .run();
  return result.meta.changes > 0;
}

export async function refundBalance(db: D1Database, userId: number, cost: number): Promise<void> {
  await db
    .prepare('UPDATE user SET balance = balance + ? WHERE id = ?')
    .bind(cost, userId)
    .run();
}

export async function recordUsage(
  db: D1Database,
  userId: number,
  apiKeyId: number,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  requestId: string
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO usage_log (user_id, api_key_id, model, input_tokens, output_tokens, cost, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(userId, apiKeyId, model, inputTokens, outputTokens, cost, requestId)
    .run();
}
```

### 10.2 聊天路由

- [ ] **Step 2: 创建 `worker/src/routes/chat.ts`**

```typescript
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import { getClientIP, ipToRegion } from '../services/region';
import {
  getProvider,
  PROVIDER_BASE_URL,
  selectPlatformKey,
  getModelPrice,
  deductBalance,
  refundBalance,
  recordUsage,
} from '../services/proxy';

const chat = new Hono<{ Bindings: Env }>();

chat.post('/v1/chat/completions', async (c) => {
  // 1. 验证 API Key
  const authHeader = c.req.header('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Missing Authorization header', type: 'invalid_request_error' } }, 401);
  }
  const bearerToken = authHeader.slice(7);

  const keyInfo = await queryOne<{
    id: number;
    user_id: number;
    status: string;
    balance: number;
    region: string | null;
  }>(
    c.env.DB,
    `SELECT ak.id, ak.user_id, ak.status, u.balance, u.region
     FROM api_key ak JOIN user u ON u.id = ak.user_id WHERE ak.token = ?`,
    bearerToken
  );

  if (!keyInfo) return c.json({ error: { message: 'Invalid API key', type: 'invalid_request_error' } }, 401);
  if (keyInfo.status !== 'active') return c.json({ error: { message: 'API key inactive', type: 'invalid_request_error' } }, 401);

  const userId = keyInfo.user_id;
  const apiKeyId = keyInfo.id;
  const userBalance = keyInfo.balance;

  // 2. 获取/探测用户地区
  let userRegion: 'CN' | 'OVERSEAS' | null = keyInfo.region as 'CN' | 'OVERSEAS' | null;
  if (!userRegion) {
    const clientIP = getClientIP(c.req.raw);
    userRegion = await ipToRegion(clientIP);
    await execute(c.env.DB, 'UPDATE user SET region = ? WHERE id = ? AND region IS NULL', userRegion, userId);
  }

  // 3. 解析请求
  const body = await c.req.json<{ model?: string; messages?: any[]; max_tokens?: number; temperature?: number }>();
  const model = body.model ?? '';
  const messages = body.messages ?? [];

  // 4. 验证模型
  const price = await getModelPrice(c.env.DB, model);
  if (!price) return c.json({ error: { message: `Model '${model}' not found`, type: 'invalid_request_error' } }, 422);

  // 5. 估算费用
  const estimatedTokens = messages.length * 50;
  const estimatedCost = (estimatedTokens / 1000) * (price.price_per_1k_input + price.price_per_1k_output);
  if (userBalance < estimatedCost) {
    return c.json({ error: { message: 'Insufficient balance', type: 'invalid_request_error' } }, 402);
  }

  // 6. 路由到 provider
  const provider = getProvider(model);
  if (!provider) return c.json({ error: { message: 'Provider not configured', type: 'invalid_request_error' } }, 422);

  const platformKey = await selectPlatformKey(c.env.DB, provider, userRegion!);
  if (!platformKey) {
    return c.json({ error: { message: 'No available platform key for this region', type: 'invalid_request_error' } }, 503);
  }

  const baseUrl = platformKey.base_url || PROVIDER_BASE_URL[provider];
  const upstreamUrl = provider === 'anthropic'
    ? `${baseUrl}/messages`
    : `${baseUrl}/chat/completions`;

  // 7. 构建上游请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${platformKey.key_token}`,
  };
  if (provider === 'anthropic') {
    headers['x-api-key'] = headers['Authorization'].replace('Bearer ', '');
    headers['anthropic-version'] = '2023-06-01';
    delete headers['Authorization'];
  }

  const upstreamBody: Record<string, any> = provider === 'anthropic'
    ? { model, messages, max_tokens: body.max_tokens ?? 1024, ...(body.temperature !== undefined ? { temperature: body.temperature } : {}) }
    : body;

  // 8. 转发请求
  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(upstreamBody),
      cf: { timeout: 60 },
    } as RequestInit);
  } catch {
    return c.json({ error: { message: 'Upstream request timeout', type: 'invalid_request_error' } }, 504);
  }

  if (!upstreamResp.ok) {
    const text = await upstreamResp.text();
    await refundBalance(c.env.DB, userId, estimatedCost);
    return c.json({ error: { message: `Upstream error: ${text.slice(0, 200)}`, type: 'invalid_request_error' } }, 502);
  }

  // 9. 解析用量并扣费
  const upstreamJson = await upstreamResp.json<{ usage?: { prompt_tokens?: number; completion_tokens?: number } }>();
  const usage = upstreamJson?.usage ?? {};
  const inputTokens = usage.prompt_tokens ?? 0;
  const outputTokens = usage.completion_tokens ?? 0;
  const inputCost = (inputTokens / 1000) * price.price_per_1k_input;
  const outputCost = (outputTokens / 1000) * price.price_per_1k_output;
  const actualCost = Math.round((inputCost + outputCost) * 1e6) / 1e6;

  if (!(await deductBalance(c.env.DB, userId, actualCost))) {
    await refundBalance(c.env.DB, userId, estimatedCost);
    return c.json({ error: { message: 'Balance deduction failed', type: 'invalid_request_error' } }, 402);
  }

  // 10. 记录用量
  const requestId = `chatcmpl-${crypto.randomUUID().slice(0, 8)}`;
  await recordUsage(c.env.DB, userId, apiKeyId, model, inputTokens, outputTokens, actualCost, requestId);

  // 11. 返回
  upstreamJson.id = requestId;
  return c.json(upstreamJson, 200);
});

// GET /v1/models
chat.get('/v1/models', async (c) => {
  const { results: prices } = await c.env.DB
    .prepare('SELECT model, provider FROM model_price WHERE enabled = 1')
    .all<{ model: string; provider: string }>();

  const data = prices.map((p) => ({
    id: p.model,
    object: 'model',
    owned_by: p.provider,
    permission: [],
    root: p.model,
  }));

  return c.json({ object: 'list', data }, 200);
});

export { chat };
```

- [ ] **Step 3: 提交**

```bash
git add worker/src/services/proxy.ts worker/src/routes/chat.ts
git commit -m "feat(worker): add chat proxy with region-based routing"
```

---

## Task 11: Worker 入口文件

**Files:**
- Create: `worker/src/index.ts`

- [ ] **Step 1: 创建 `worker/src/index.ts`**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import { verifyToken, getCookieName } from './services/jwt';
import { queryOne } from './db/index';
import { auth } from './routes/auth';
import { keys } from './routes/keys';
import { chat } from './routes/chat';
import { user } from './routes/user';
import { usage } from './routes/usage';
import { admin } from './routes/admin';
import type { Env } from './db/index';
import type { SafeUser } from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('/*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 注入用户上下文到所有需要认证的路由
app.use('/*', async (c, next) => {
  const token = getCookie(c, getCookieName());
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const safeUser = await queryOne<SafeUser>(
        c.env.DB,
        'SELECT id, email, balance, role, region FROM user WHERE id = ?',
        payload.sub
      );
      c.set('user', safeUser ?? undefined);
    }
  }
  await next();
});

// 挂载路由
app.route('/api/auth', auth);
app.route('/api/keys', keys);
app.route('/api/user', user);
app.route('/api/admin', admin);
app.route('/', usage);
app.route('/', chat);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', service: 'aihubs-worker' }));

export default {
  fetch: app.fetch,
};
```

- [ ] **Step 2: 提交**

```bash
git add worker/src/index.ts
git commit -m "feat(worker): add Hono app entry point with all routes"
```

---

## Task 12: Cloudflare Pages 路由配置

**Files:**
- Create: `_redirects`

- [ ] **Step 1: 创建 `_redirects`**

```
# Cloudflare Pages：将所有 /api/* 请求代理到 Worker
/api/*  https://aihubs-worker.workers.dev/api/*  200
/health https://aihubs-worker.workers.dev/health 200
```

> 注意：替换 `aihubs-worker.workers.dev` 为实际部署后的 Worker 域名。

- [ ] **Step 2: 提交**

```bash
git add _redirects
git commit -m "chore(pages): add _redirects for Cloudflare Pages to Worker proxy"
```

---

## Task 13: D1 数据库初始化与部署

**Files:**
- Modify: `worker/wrangler.toml`（填入实际 database_id）

- [ ] **Step 1: 创建 D1 数据库**

```bash
cd worker && wrangler d1 create aihubs-db
```

输出示例：
```
[[d1_databases]]
binding = "DB"
database_name = "aihubs-db"
database_id = "4f4bxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

- [ ] **Step 2: 更新 `wrangler.toml` 中的 `database_id`**

将 `YOUR_DATABASE_ID_HERE` 替换为上一步的 `database_id`。

- [ ] **Step 3: 初始化数据库表**

```bash
cd worker && wrangler d1 execute aihubs-db --file=./schema.sql
```

- [ ] **Step 4: 部署 Worker**

```bash
cd worker && wrangler deploy
```

- [ ] **Step 5: Cloudflare Pages 后台配置**

1. 进入 Pages 项目设置
2. 添加 Production 环境绑定：Worker → `aihubs-worker`
3. 配置路由规则：`/api/*` → Worker，`/health` → Worker

- [ ] **Step 6: 提交**

```bash
git add worker/wrangler.toml
git commit -m "chore(worker): update wrangler.toml with D1 database id"
```

---

## 实施检查清单

完成所有 Task 后，确认以下内容：

- [ ] `wrangler dev` 本地开发正常（SQLite 模拟 D1）
- [ ] D1 表创建成功（`wrangler d1 execute`）
- [ ] `wrangler deploy` 部署成功
- [ ] 注册/登录 Cookie 正常工作
- [ ] API Key 创建和撤销正常
- [ ] 聊天代理路由正确（含地区路由）
- [ ] 用量统计正常
- [ ] Pages → Worker 代理正常
- [ ] 前端 `api.js` 无需修改（BASE 保持 `''`）
