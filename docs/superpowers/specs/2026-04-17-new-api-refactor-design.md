# New API 重构设计方案

**日期**: 2026-04-17
**状态**: 待用户确认

---

## 一、项目背景

### 1.1 现状
- **NetWork**: 简单的 AI API 中转平台，使用 Cloudflare Workers (Node.js) + 基础 HTML 前端
- **问题**: 缺少计费系统、Token 统计、渠道管理等核心功能

### 1.2 目标
- 重构为功能完整的 AI 网关系统
- 参考 `C:\AI\new-api` 项目架构
- 独立前端 + New API 后端

---

## 二、技术选型

| 模块 | 技术 | 说明 |
|------|------|------|
| 后端 | Go + Gin + GORM | New API 原生框架 |
| 数据库 | SQLite (开发) / MySQL (生产) | GORM 支持多数据库 |
| 缓存 | Redis | 会话、限流、渠道缓存 |
| 前端 | React + Semi UI + Tailwind | 基于 New API 前端技术栈 |
| 构建 | Vite | 快速开发体验 |
| 国际化 | i18next | 支持多语言 |
| 部署 | Docker Compose | 一键部署 |

---

## 三、架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器用户                            │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              React 前端 (独立项目)                        │
│   ├── 落地页 (landing)                                  │
│   ├── 登录/注册 (auth)                                   │
│   ├── 控制台 (dashboard)                                │
│   ├── API Key 管理                                       │
│   └── 用户设置                                           │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP API
┌─────────────────▼───────────────────────────────────────┐
│          New API 后端 (Go + Gin)                         │
│   ├── 认证 (JWT/Session/OAuth)                          │
│   ├── 用户管理                                           │
│   ├── Token/API Key 管理                                │
│   ├── 渠道管理 (30+ AI 适配器)                           │
│   ├── 计费/额度系统                                       │
│   └── AI 请求代理                                        │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   ┌─────────┐         ┌─────────┐
   │ SQLite  │         │  Redis  │
   └─────────┘         └─────────┘
```

### 3.2 项目结构

```
NetWork/
├── new-api/                 # 后端 (Fork 自 C:\AI\new-api)
│   ├── main.go
│   ├── controller/          # 控制器
│   ├── service/             # 服务层
│   ├── model/               # 数据模型
│   ├── relay/               # 核心代理层
│   │   └── channel/         # AI 渠道适配器 (30+)
│   ├── middleware/          # 中间件
│   ├── router/              # 路由
│   └── common/              # 公共组件
│
├── frontend/                # 前端 (新项目)
│   ├── src/
│   │   ├── pages/          # 页面
│   │   │   ├── Landing/     # 落地页
│   │   │   ├── Auth/        # 登录/注册
│   │   │   ├── Dashboard/   # 控制台
│   │   │   ├── APIKeys/     # API Key 管理
│   │   │   └── Settings/    # 用户设置
│   │   ├── components/      # 组件
│   │   ├── services/        # API 服务
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── i18n/             # 国际化
│   │   └── styles/          # 样式
│   ├── package.json
│   └── vite.config.js
│
└── docker/                  # 部署配置
    ├── docker-compose.yml
    └── Dockerfile
```

---

## 四、功能模块

### 4.1 后端功能 (New API 原生能力)

| 模块 | 功能 |
|------|------|
| **AI 代理** | 30+ AI 渠道适配、请求转发、格式转换 |
| **认证** | JWT Token、Bearer Token、OAuth (Discord/Telegram) |
| **用户管理** | 注册、登录、权限控制 |
| **API Key** | 创建、撤销、IP 白名单、模型限制 |
| **计费系统** | 预扣费、结算、退款、用量统计 |
| **渠道管理** | 分组、权重、故障切换 |
| **Token 计数** | 文本、图片、音频精确计费 |

### 4.2 前端功能

| 页面 | 功能 |
|------|------|
| **落地页** | 产品介绍、定价、代理商招募 |
| **登录/注册** | 邮箱登录、OAuth 登录、注册 |
| **控制台** | 余额统计、请求量图表、活跃 Key |
| **API Key 管理** | 创建、复制、撤销 Key |
| **用量统计** | Token 用量、费用明细 |
| **用户设置** | 个人信息、API Token 设置 |

---

## 五、数据模型

### 5.1 核心实体

```
User (用户)
├── id, email, name, password
├── quota (余额), usedQuota (已用)
└── tokens[] (API Keys)

Token (API Key)
├── key (sk-xxx)
├── userId, quota (剩余额度)
├── modelLimits, allowIps (权限控制)
└── group, status

Channel (AI 渠道)
├── type (OpenAI/Claude/Gemini 等)
├── key (API Key), baseURL
├── models, group, weight
└── status, usedQuota

Group (分组)
├── name, priority
└── channels[] (渠道列表)
```

### 5.2 计费流程

```
1. PreConsumeBilling: 预扣费 (估算 Token 数)
2. DoRequest: 转发 AI 请求
3. PostConsumeQuota: 实际消费结算
4. (失败时) Refund: 退还额度
```

---

## 六、API 设计

### 6.1 管理 API (前端调用)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/register` | 用户注册 |
| POST | `/api/user/login` | 用户登录 |
| GET | `/api/user/info` | 获取用户信息 |
| GET | `/api/token` | 获取 Token 列表 |
| POST | `/api/token` | 创建 Token |
| DELETE | `/api/token/:id` | 删除 Token |
| GET | `/api/usage` | 获取用量统计 |

### 6.2 代理 API (客户端调用)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | ChatGPT 兼容接口 |
| POST | `/v1/messages` | Claude 兼容接口 |
| POST | `/v1/images/generations` | 图像生成 |
| POST | `/v1/audio/*` | 音频处理 |
| POST | `/v1/embeddings` | 向量嵌入 |

---

## 七、部署方案

### 7.1 Docker Compose 配置

```yaml
version: '3.8'
services:
  new-api:
    build: ./new-api
    ports:
      - "3000:3000"
    environment:
      - SQL_DSN=/data/new-api.db
      - REDIS_CONN_STRING=redis:6379
    volumes:
      - ./data:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 7.2 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `SQL_DSN` | 数据库连接 | `/data/new-api.db` |
| `REDIS_CONN_STRING` | Redis 连接 | `redis:6379` |
| `SESSION_SECRET` | 会话密钥 | `xxx` |
| `CRYPTO_SECRET` | 加密密钥 | `xxx` |
| `INITIAL_QUOTA` | 初始额度 | `1000000` |

---

## 八、实施计划

### Phase 1: 后端搭建
1. Fork `C:\AI\new-api` 项目
2. 配置数据库和 Redis
3. 验证核心代理功能

### Phase 2: 前端开发
1. 初始化 React 项目
2. 实现登录/注册页面
3. 实现控制台和 API Key 管理
4. 实现用量统计页面

### Phase 3: 部署上线
1. 配置 Docker Compose
2. 部署测试环境
3. 切换上线

---

## 九、注意事项

1. **数据迁移**: 不迁移现有用户数据，作为全新平台上线
2. **域名**: 后期重新定义，现阶段使用临时域名或 localhost
3. **API 兼容**: 保持与 OpenAI 兼容格式的 API 兼容性
4. **安全加固**: 生产环境需配置 HTTPS、CORS、限流等

---

## 十、UI 风格融合设计

结合 NetWork 和 New API 的优点：

| 特性 | NetWork 风格 | New API 风格 | 融合方案 |
|------|-------------|--------------|---------|
| **色彩** | 深色科技感 | Semi UI 默认 | 深色主调 + 科技蓝/紫色点缀 |
| **布局** | 简洁单页 | 复杂仪表盘 | 简洁导航 + 信息密度适中 |
| **动效** | 粒子背景 | 基础过渡 | 保留粒子/渐变动效，增强交互反馈 |
| **组件** | 原生 HTML | Semi UI 组件 | Semi UI 组件 + 自定义样式 |
| **落地页** | 粒子背景 + 模型卡片 | 无落地页 | 保留粒子背景，模型展示卡片化 |
| **控制台** | 基础统计 | 详细图表 | 保留简洁风格 + 增加用量图表 |

**融合要点**:
- 深色主题为主，适配开发者用户
- 保留 NetWork 的粒子背景和科技感
- 使用 Semi UI 组件保证一致性和开发效率
- 控制台保持简洁，避免信息过载
