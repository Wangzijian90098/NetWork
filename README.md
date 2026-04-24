# AI API 中转平台

一站式 AI 模型接入平台，兼容 OpenAI 格式，支持 GPT、Claude、Gemini、DeepSeek 等主流模型。


[![Deploy with Cloudflare Pages](https://deploy.pages.cloudflare.com/button.svg)](https://deploy.pages.cloudflare.com/)

**线上地址**：https://wangzijian-networking-xxxx.pages.dev（部署后替换）

---

## 项目架构

```
NetWork/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── hooks/         # React Hooks
│   │   ├── i18n/          # 国际化
│   │   └── styles/        # 样式文件
│   └── dist/              # 构建输出
│
├── java-backend/          # Java Spring Boot 后端（主服务）
│   ├── src/main/java/com/aihub/
│   │   ├── controller/    # REST 控制器
│   │   ├── service/       # 业务逻辑层
│   │   ├── repository/    # 数据访问层
│   │   ├── entity/        # 实体模型
│   │   ├── dto/           # 数据传输对象
│   │   ├── security/      # 安全配置（JWT/Spring Security）
│   │   ├── config/        # 配置类
│   │   └── util/          # 工具类
│   ├── src/main/resources/
│   │   └── application.yml
│   ├── pom.xml
│   ├── build.sh           # 构建脚本
│   └── run.sh             # 启动脚本
│
├── backend/               # Python Flask 后端（备用）
│   ├── ai_hub_backend.py
│   ├── routes/            # 路由（auth/key/chat/admin/usage）
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   ├── utils/             # 工具类
│   └── data/              # 数据库
│
├── new-api/               # Go API 服务
│   ├── main.go
│   ├── controller/
│   ├── service/
│   ├── model/
│   └── router/
│
├── worker/                # Worker 服务
│   └── src/
│
├── docker/                # Docker 配置
│   ├── data/
│   └── logs/
│
├── assets/                # 静态资源
│   ├── console.css
│   └── console.js
│
├── landing.html           # 落地页
├── login.html             # 登录页
├── dashboard.html         # 控制台
├── api-keys.html          # Key 管理
│
├── docs/                  # 文档
└── memory/                # AI 记忆系统
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + HTML5/CSS3 |
| 主后端 | Java 17 + Spring Boot 3.2 + Spring Security + JPA |
| 备用后端 | Python 3 + Flask |
| API 服务 | Go + Gin |
| 数据库 | MySQL 8.0 |
| 认证 | JWT + BCrypt |
| 部署 | Cloudflare Pages（前端）+ Docker（后端） |

---

## 页面预览

| 页面 | 路径 | 说明 |
|------|------|------|
| 官网首页 | [landing.html](./landing.html) | 落地页，含粒子背景、模型展示、代理商招募 |
| 登录页 | [login.html](./login.html) | 模拟登录，数据存储在 localStorage |
| 控制台概览 | [dashboard.html](./dashboard.html) | 账户余额、请求量、活跃 Key 统计 |
| API Key 管理 | [api-keys.html](./api-keys.html) | 创建、复制、撤销 API Key |

---

## 本地运行

**前端（React）：**
```bash
cd D:\NetWork\frontend
npm install
npm run dev
# 浏览器打开 http://localhost:5173/
```

**前端（静态页面）：**
```bash
cd D:\NetWork
python -m http.server 8090
# 浏览器打开 http://127.0.0.1:8090/
```

**Java 后端（推荐）：**
```bash
cd D:\NetWork\java-backend
# 首次运行需配置 MySQL，参考 mysql-setup.md
./build.sh   # 构建项目
./run.sh     # 启动服务 http://localhost:8080
```

**Python 后端：**
```bash
cd D:\NetWork\backend
pip install -r requirements.txt
python download_deps.py   # 首次运行下载 H2 JAR
python ai_hub_backend.py  # 启动服务 http://localhost:8080
```

> 默认管理员账号：admin@aihubs.com / admin123

---

## Docker 部署

**使用 Docker Compose 一键部署：**

```bash
cd docker
cp .env.example .env  # 编辑环境变量
docker-compose up -d
```

访问 `http://localhost` 即可使用。

**环境变量 (.env)：**
```env
MYSQL_ROOT_PASSWORD=your_secure_password
```

**服务端口：**
| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 80 | React 应用 |
| 后端 | 8080 | Java Spring Boot |
| MySQL | 3306 | 数据库 |

**停止服务：**
```bash
docker-compose down
```

**重新构建：**
```bash
docker-compose up -d --build
```

---

## 开发阶段

- [x] 落地页已完成
- [x] React 前端（登录/注册/控制台/API Keys/设置/文档）
- [x] Java Spring Boot 后端已完成
  - [x] 用户认证（JWT + Spring Security）
  - [x] API Key 管理
  - [x] 聊天代理服务（区域路由）
  - [x] 使用统计与趋势
  - [x] 管理员功能
  - [x] 数据初始化
- [x] Docker 部署配置
- [x] Cloudflare Workers 基础配置
- [ ] 生产环境部署
- [ ] 单元测试覆盖
