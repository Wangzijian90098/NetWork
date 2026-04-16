# 国内外服务器智能路由设计方案

## 1. 背景与目标

本项目（AI API 中转平台）需要支持国内外用户请求智能路由到对应的 API 端点：
- 国内用户（CN）请求路由到国内 Provider（阿里云 DashScope、智谱 AI、DeepSeek 等）
- 海外用户（OVERSEAS）请求路由到海外 Provider（OpenAI、Anthropic、Google 等）

**核心原则：** 同一套代码，零感知切换，用户无感的后端路由。

---

## 2. 路由策略

### 2.1 地区判断优先级

```
用户地区已配置？
  ├─ 是 → 直接使用账户中的 region 值
  └─ 否 → IP 自动探测 → 写入用户账户（仅首次）
              │
         探测成功？→ 继续处理
         探测失败？→ 返回错误，要求用户联系管理员
```

### 2.2 注册时的地区配置

- 注册页面新增「主要使用地区」下拉框
- 默认值由前端根据访问者 IP 自动预选
- 用户在账户设置页面可随时修改

### 2.3 现有用户的地区处理

- 首次发起 API 请求时，通过 IP 自动探测并写入用户账户
- 一次性静默配置，无需用户操作

---

## 3. 数据模型改动

### 3.1 `user` 表

新增字段：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `region` | VARCHAR(10) | NULL | `CN` / `OVERSEAS` / `NULL`（未配置） |

### 3.2 `platform_key` 表

新增字段：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `region` | VARCHAR(10) | `GLOBAL` | `CN` / `OVERSEAS` / `GLOBAL`（适用于所有地区） |

---

## 4. IP 归属地探测

### 4.1 选型

使用 `ip2region` 纯 Python 实现，数据文件约 2MB，本地存储，无外部 HTTP 依赖。

### 4.2 实现

- 数据文件：`backend/data/ip2region.xdb`（随项目一起提交）
- 启动时加载到内存，查询延迟 < 1ms
- 中国大陆（CN）→ `CN`，其余 → `OVERSEAS`

### 4.3 兼容性

- 服务部署在海外云平台时，同样可准确判断用户真实 IP
- 读取 `X-Forwarded-For` 或 `X-Real-IP` 头获取真实 IP（反向代理场景）

---

## 5. Provider 路由表

### 5.1 现有映射（保持不变，调整 base_url）

| Provider | 原 base_url（现统一出口） | 地区 |
|----------|--------------------------|------|
| openai | `https://api.openai.com/v1` | OVERSEAS |
| anthropic | `https://api.anthropic.com/v1` | OVERSEAS |
| google | `https://generativelanguage.googleapis.com/v1beta` | OVERSEAS |
| deepseek | `https://api.deepseek.com/v1` | CN |
| moonshot | `https://api.moonshot.cn/v1` | CN |
| zhipu | `https://open.bigmodel.cn/api/paas/v4` | CN |
| alibaba | `https://dashscope.aliyuncs.com/compatible-mode/v1` | CN |

### 5.2 路由算法

```python
def select_platform_key(provider: str, region: str) -> dict | None:
    """
    1. 优先查找 region == 请求地区 的 Key
    2. 降级查找 region == GLOBAL 的 Key
    3. 均未找到 → 返回 None
    """
```

---

## 6. API 路由流程（proxy_service.py）

```
proxy_chat_request(bearer_token, request_data)
  │
  ├─ 1. 验证 API Key
  │
  ├─ 2. 获取用户地区（已配置? 直接返回 : IP探测并写入DB）
  │       └─ 探测失败 → 返回 400 "Region detection failed"
  │
  ├─ 3. 估算费用 & 检查余额
  │
  ├─ 4. 根据 model 推断 provider
  │
  ├─ 5. 根据 (provider + region) 查找对应地区的 Key
  │       └─ 未找到 → 返回 503 "No available key for region"
  │
  ├─ 6. 构造请求并转发（provider 通用处理，Anthropic 特殊处理不变）
  │
  ├─ 7. 扣费 & 记录用量
  │
  └─ 8. 返回上游响应
```

---

## 7. 前端改动

### 7.1 注册页面（login.html 或新建 register.html）

新增表单字段：
```html
<label>主要使用地区</label>
<select id="region" name="region">
  <option value="CN">🇨🇳 国内（推荐）</option>
  <option value="OVERSEAS">🌐 海外</option>
</select>
```

默认值：前端通过 IP API（如 ipify.org）预判地区并预选。

### 7.2 用户设置页面（可选，快速版本可先不做）

提供地区切换入口。

---

## 8. 后端改动

### 8.1 数据库迁移

执行 SQL：
```sql
ALTER TABLE user ADD COLUMN region VARCHAR(10) DEFAULT NULL;
ALTER TABLE platform_key ADD COLUMN region VARCHAR(10) DEFAULT 'GLOBAL';
```

### 8.2 新增文件

| 文件 | 说明 |
|------|------|
| `backend/utils/ip_region.py` | IP → 地区 探测工具 |
| `backend/data/ip2region.xdb` | IP 归属地数据文件 |
| `backend/download_deps.py` | 更新以下载 ip2region 数据文件 |

### 8.3 修改文件

| 文件 | 改动 |
|------|------|
| `backend/services/proxy_service.py` | 接入地区路由逻辑，修改 `select_platform_key` |
| `backend/services/key_service.py` | `validate_key` 返回中加入 `region` 字段 |
| `backend/routes/auth_routes.py` | 注册接口支持 `region` 参数 |
| `backend/data/database.py` | 数据库迁移脚本 |
| `backend/routes/auth_routes.py` 或新建 | 用户设置接口（地区修改） |
| `frontend/login.html` | 注册表单增加地区字段 |
| `frontend/assets/api.js` | 可选：登录前预获取 IP 地区 |

---

## 9. 错误处理

| 场景 | HTTP 状态码 | 错误消息 |
|------|------------|---------|
| IP 探测失败 | 400 | `Region detection failed, please contact support` |
| 用户未配置地区且探测不可用 | 400 | `Unable to detect region` |
| 该地区无可用 Key | 503 | `No available platform key for this region` |
| 模型在该地区不支持 | 422 | `Model not available in your region` |

---

## 10. 测试计划

1. **国内用户请求**：Mock IP 为国内 → 验证路由到 CN Provider
2. **海外用户请求**：Mock IP 为海外 → 验证路由到 OVERSEAS Provider
3. **新用户注册**：验证地区字段正确写入
4. **老用户首次请求**：验证地区自动探测并写入
5. **Key 池隔离**：验证 CN Key 不会被 OVERSEAS 请求使用
6. **降级逻辑**：验证 GLOBAL Key 在各地区均可用

---

## 11. 部署注意事项

- `ip2region.xdb` 文件需随项目一起部署（~2MB）
- `download_deps.py` 已包含此文件下载，首次部署会自动拉取
- 数据库迁移需在首次部署时执行（或通过启动脚本自动执行）
