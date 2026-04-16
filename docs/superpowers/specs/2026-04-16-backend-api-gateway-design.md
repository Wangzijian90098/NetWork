# AI API 中转平台 — 后端 API 网关设计文档

> **作者：** Diamond-Wzj
> **日期：** 2026-04-16
> **阶段：** 第三阶段

---

## 一、项目概述

**目标：** 构建一个完整的中转 API 网关平台，支持用户管理、余额系统、API Key 管理、平台 Key 池、请求路由和用量计费。

**技术栈：**
- 语言：Kotlin
- HTTP 服务：`com.sun.net.httpserver`（JDK 内置，零依赖）
- 数据库：H2（文件模式，零配置）
- 构建：Kotlin 脚本直接运行（无需 Gradle/Maven）
- 后期可平滑迁移至 MySQL（仅需更换驱动和连接字符串）

---

## 二、系统架构

```
用户请求 (API Key)
    ↓
[认证层] 验证 Key 是否存在、是否有效
    ↓
[余额层] 检查余额是否足够
    ↓
[路由层] 根据 model 参数选择对应的 Platform Key
    ↓
[代理层] 用 Platform Key 请求上游模型 (OpenAI/Anthropic/DeepSeek...)
    ↓
[计费层] 根据模型单价扣减余额，记录 usage_log
    ↓
[返回层] 将上游响应透传给用户
```

---

## 三、数据库设计

### 3.1 ER 关系图

```
user (1) ──┬── (N) api_key
           └── (N) usage_log

platform_key (N) ── (1) model_price
                         (由 model_price 决定扣费单价)

usage_log 记录每笔请求的用量和费用
```

### 3.2 表结构

#### user（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (PK) | 自增主键 |
| email | VARCHAR(255) UNIQUE | 登录邮箱 |
| password | VARCHAR(255) | 密码（BCrypt） |
| balance | DECIMAL(10,4) DEFAULT 0 | 余额（美元） |
| role | VARCHAR(20) DEFAULT 'user' | 角色：user / admin |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### api_key（用户 API Key 表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (PK) | 自增主键 |
| user_id | BIGINT (FK) | 关联用户 |
| key_name | VARCHAR(100) | Key 名称 |
| token | VARCHAR(64) UNIQUE | Key Token (sk-xxx) |
| status | VARCHAR(20) | active / revoked |
| created_at | TIMESTAMP | 创建时间 |

#### platform_key（平台上游 Key 表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (PK) | 自增主键 |
| provider | VARCHAR(50) | 提供方：openai / anthropic / deepseek / google / moonshot / zhipu / alibaba 等 |
| key_token | VARCHAR(255) | 上游 API Key |
| base_url | VARCHAR(255) | 上游 API 地址 |
| status | VARCHAR(20) | active / exhausted / revoked |
| created_at | TIMESTAMP | 添加时间 |

#### model_price（模型单价表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (PK) | 自增主键 |
| model | VARCHAR(100) UNIQUE | 模型名称（如 gpt-4o、claude-sonnet-4-6） |
| provider | VARCHAR(50) | 提供方 |
| price_per_1k_input | DECIMAL(10,6) | 每千 Token 输入单价（美元） |
| price_per_1k_output | DECIMAL(10,6) | 每千 Token 输出单价（美元） |
| enabled | BOOLEAN DEFAULT TRUE | 是否启用 |

#### usage_log（用量记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (PK) | 自增主键 |
| user_id | BIGINT (FK) | 关联用户 |
| api_key_id | BIGINT (FK) | 使用的 Key |
| model | VARCHAR(100) | 请求的模型 |
| input_tokens | INT | 输入 Token 数 |
| output_tokens | INT | 输出 Token 数 |
| cost | DECIMAL(10,6) | 本次费用（美元） |
| request_time | TIMESTAMP | 请求时间 |
| request_id | VARCHAR(64) | 请求唯一 ID |

---

## 四、API 接口设计

### 4.1 用户认证接口

#### POST /api/auth/register
注册用户

**请求：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "message": "注册成功"
}
```

#### POST /api/auth/login
用户登录

**请求：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "user_token_xxx",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "balance": "10.0000"
    }
  }
}
```

### 4.2 用户管理接口（Admin）

#### GET /api/admin/users
获取用户列表

#### POST /api/admin/users/{id}/recharge
给用户充值

**请求：**
```json
{
  "amount": 10.00
}
```

#### DELETE /api/admin/users/{id}
删除用户

### 4.3 API Key 管理接口

#### GET /api/keys
获取当前用户的 Key 列表

#### POST /api/keys
创建新 Key

**请求：**
```json
{
  "name": "我的测试 Key"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "我的测试 Key",
    "token": "sk-aihub-xxxxxxxxxxxx",
    "created_at": "2026-04-16T10:00:00"
  }
}
```

#### DELETE /api/keys/{id}
撤销 Key

### 4.4 模型代理接口（兼容 OpenAI 格式）

#### POST /v1/chat/completions
聊天补全（核心接口）

**请求头：**
```
Authorization: Bearer sk-aihub-xxxxxxxxxxxx
Content-Type: application/json
```

**请求体（OpenAI 兼容）：**
```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7
}
```

**响应体（OpenAI 兼容）：**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好！有什么可以帮你的吗？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

#### GET /v1/models
获取可用模型列表

**响应：**
```json
{
  "object": "list",
  "data": [
    {"id": "gpt-4o", "object": "model", "owned_by": "openai"},
    {"id": "claude-sonnet-4-6", "object": "model", "owned_by": "anthropic"},
    {"id": "deepseek-chat", "object": "model", "owned_by": "deepseek"}
  ]
}
```

#### GET /v1/account/usage
获取当前用户用量统计

### 4.5 平台 Key 管理接口（Admin）

#### GET /api/admin/platform-keys
获取平台 Key 列表

#### POST /api/admin/platform-keys
添加平台 Key

**请求：**
```json
{
  "provider": "openai",
  "key_token": "sk-xxxx",
  "base_url": "https://api.openai.com"
}
```

#### DELETE /api/admin/platform-keys/{id}
删除平台 Key

### 4.6 模型价格管理接口（Admin）

#### GET /api/admin/model-prices
获取所有模型的单价

#### POST /api/admin/model-prices
添加/更新模型单价

**请求：**
```json
{
  "model": "gpt-4o",
  "provider": "openai",
  "price_per_1k_input": 0.0025,
  "price_per_1k_output": 0.01
}
```

---

## 五、核心业务流程

### 5.1 请求处理流程

```
1. 用户发起 POST /v1/chat/completions
   └─ Header: Authorization: Bearer sk-aihub-xxx

2. 认证层
   ├─ 从请求头提取 Bearer Token
   ├─ 查询 api_key 表，验证 token 存在且 status=active
   ├─ 关联查询 user 表，验证用户状态
   └─ 通过 → 继续，失败 → 返回 401

3. 余额检查
   ├─ 查询 user.balance
   ├─ 根据 model 查询 model_price
   ├─ 估算本次请求最大费用
   └─ 余额足够 → 继续，不足 → 返回 402 Payment Required

4. 上游路由
   ├─ 根据 model 匹配 provider
   ├─ 从 platform_key 表选择一条 status=active 的 Key
   └─ 如果没有可用 Key → 返回 503 服务暂时不可用，请稍后重试。

5. 代理转发
   ├─ 构建上游请求（替换 base_url + 注入 platform_key）
   ├─ HTTP POST 到上游（OpenAI / Anthropic / DeepSeek ...）
   ├─ 解析上游响应（提取 usage 数据）
   └─ 失败 → 返回 502 Bad Gateway

6. 计费扣费
   ├─ 根据 usage.input_tokens * price_per_1k_input / 1000
   ├─ 根据 usage.output_tokens * price_per_1k_output / 1000
   ├─ 总费用 = 输入费用 + 输出费用
   ├─ 更新 user.balance -= 总费用
   └─ 写入 usage_log

7. 返回响应
   └─ 将上游响应（去掉内部字段）返回给用户
```

### 5.2 模型路由映射

| model 前缀 | provider | base_url |
|-----------|---------|---------|
| gpt-4o / gpt-4 / gpt-3.5 | openai | https://api.openai.com |
| claude- | anthropic | https://api.anthropic.com |
| deepseek- | deepseek | https://api.deepseek.com |
| gemini- | google | https://generativelanguage.googleapis.com |
| moonshot- | moonshot | https://api.moonshot.cn |
| glm- | zhipu | https://open.bigmodel.cn |
| qwen- | alibaba | https://dashscope.aliyuncs.com |

---

## 六、项目结构

```
backend/
├── AiHubBackend.kt          # 主入口，启动 HTTP 服务
├── data/
│   ├── Database.kt          # H2 数据库初始化 + 连接管理
│   └── Models.kt            # 数据模型类
├── routes/
│   ├── AuthRoutes.kt        # 认证接口
│   ├── KeyRoutes.kt         # API Key 管理接口
│   ├── ChatRoutes.kt        # 聊天代理接口
│   └── AdminRoutes.kt       # 管理员接口
├── service/
│   ├── AuthService.kt       # 认证逻辑
│   ├── KeyService.kt        # Key 管理逻辑
│   ├── ProxyService.kt      # 代理转发逻辑
│   └── UsageService.kt      # 用量统计逻辑
└── util/
    ├── JwtUtil.kt           # JWT Token 生成/验证
    └── HashUtil.kt          # 密码哈希工具
```

**说明：** 所有文件均为独立 `.kt` 文件，无需 Gradle/Maven 项目结构，Kotlin 编译器直接编译运行。

---

## 七、安全设计

| 安全点 | 实现方式 |
|------|---------|
| 密码存储 | BCrypt 哈希，不存明文 |
| API Key | `sk-aihub-` 前缀 + 32 位随机字符，不可枚举 |
| 请求认证 | JWT Token（登录后颁发，有效期 7 天） |
| 管理员 | 独立 role=admin，Admin 接口需额外验证 role |
| 上游 Key 隔离 | 用户不接触平台 Key，全程在后端流转 |
| 限流 | 每个 Key 每分钟最多 N 次请求（可配置） |

---

## 八、错误码

| HTTP 状态码 | 含义 |
|------------|------|
| 400 | 请求参数错误 |
| 401 | API Key 无效或缺失 |
| 402 | 余额不足 |
| 403 | 无权限（如普通用户访问 Admin 接口） |
| 404 | 资源不存在 |
| 422 | 模型不支持 |
| 429 | 请求过于频繁（限流） |
| 502 | 上游服务响应错误 |
| 503 | 没有可用的平台 Key |
| 500 | 服务器内部错误 |

---

## 九、前端集成说明

前端控制台（dashboard.html / api-keys.html）目前使用 localStorage 模拟数据。接入真实后端后：

1. 登录接口替换 `setDemoUser()` 为真实 `/api/auth/login` 调用
2. API Key 管理替换 `createKey()` / `revokeKey()` 为真实接口
3. 仪表盘余额替换为 `/api/account/usage` 返回数据
4. Chat 代理接口地址指向 `http://localhost:8080/v1/chat/completions`

---

## 十、状态

- [ ] 数据库设计与实现
- [ ] 用户认证（注册/登录/JWT）
- [ ] API Key 管理（创建/撤销）
- [ ] 平台 Key 管理（Admin）
- [ ] 模型单价管理（Admin）
- [ ] 聊天代理接口（核心）
- [ ] 用量记录与扣费
- [ ] 前端对接
