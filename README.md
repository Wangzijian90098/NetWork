# AI API 中转平台

一站式 AI 模型接入平台，兼容 OpenAI 格式，支持 GPT、Claude、Gemini、DeepSeek 等主流模型。

[![Deploy with Cloudflare Pages](https://deploy.pages.cloudflare.com/button.svg)](https://deploy.pages.cloudflare.com/)

**线上地址**：https://wangzijian-networking-xxxx.pages.dev（部署后替换）

---

## 页面预览

| 页面 | 路径 | 说明 |
|------|------|------|
| 官网首页 | [index.html](./index.html) | 落地页，含粒子背景、模型展示、代理商招募 |
| 登录页 | [login.html](./login.html) | 模拟登录，数据存储在 localStorage |
| 控制台概览 | [dashboard.html](./dashboard.html) | 账户余额、请求量、活跃 Key 统计 |
| API Key 管理 | [api-keys.html](./api-keys.html) | 创建、复制、撤销 API Key |

## 技术栈

- HTML5 + CSS3 + Vanilla JavaScript
- Canvas 粒子动态背景
- localStorage 模拟登录态与演示数据
- 零外部依赖，可离线运行

## 本地运行

```bash
cd D:\NetWork
python -m http.server 8090
# 浏览器打开 http://127.0.0.1:8090/
```

## 后端运行

```bash
cd D:\NetWork/backend
pip install -r requirements.txt
python download_deps.py   # 首次运行下载 H2 JAR
python AiHubBackend.py    # 启动服务 http://localhost:8080
```

后端 API 文档见 `docs/superpowers/specs/2026-04-16-backend-api-gateway-design.md`

---

## 开发阶段

- [x] 落地页已完成
- [x] 控制台框架已完成
- [ ] 后端 API 网关（规划中）

---

*Powered by Claude Code*
