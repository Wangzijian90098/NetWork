# AI API 中转平台

一站式 AI 模型接入平台，兼容 OpenAI 格式，支持 GPT、Claude、Gemini、DeepSeek 等主流模型。

[![Deploy with Cloudflare Pages](https://deploy.pages.cloudflare.com/button.svg)](https://deploy.pages.cloudflare.com/)

**线上地址**：https://wangzijian-networking-xxxx.pages.dev（部署后替换）

---

## 项目架构

```
NetWork/
├── landing.html           # 官网首页（粒子背景、模型展示）
├── login.html             # 登录页
├── dashboard.html         # 控制台概览
├── api-keys.html          # API Key 管理
├── assets/                # 公共资源
│   ├── console.css
│   └── console.js
├── backend/              # Python Flask 后端
│   ├── ai_hub_backend.py  # 主入口
│   ├── requirements.txt
│   ├── data/              # 数据库层
│   ├── models/            # 数据模型
│   ├── routes/            # 路由（auth/key/chat/admin/usage）
│   ├── services/          # 业务逻辑
│   └── utils/             # 工具类（JWT/BCrypt）
└── docs/                  # 设计文档与计划
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | HTML5 + CSS3 + Vanilla JavaScript, Canvas 粒子背景 |
| 后端 | Python 3 + Flask + SQLite (H2 兼容) |
| 认证 | JWT + BCrypt |
| 部署 | Cloudflare Pages（前端） |

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

**前端：**
```bash
cd D:\NetWork
python -m http.server 8090
# 浏览器打开 http://127.0.0.1:8090/
```

**后端：**
```bash
cd D:\NetWork/backend
pip install -r requirements.txt
python download_deps.py   # 首次运行下载 H2 JAR
python ai_hub_backend.py  # 启动服务 http://localhost:8080
```

> 后端默认管理员：admin@aihubs.com / admin123

---

## 开发阶段

- [x] 落地页已完成
- [x] 控制台框架已完成
- [x] 后端 API 网关已完成
- [ ] 前端对接后端（真实 API）
- [ ] Cloudflare Workers 自动配置

---
