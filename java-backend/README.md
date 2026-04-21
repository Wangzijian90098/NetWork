# AIHub Backend - Java Spring Boot

AI API 中转平台后端，使用 Java Spring Boot 实现。

## 技术栈

- Java 17+
- Spring Boot 3.2
- Spring Data JPA
- MySQL 8.x
- Spring Security + JWT
- WebClient (HTTP 代理)

## 快速开始

### 1. 创建数据库

```sql
CREATE DATABASE aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 修改配置

编辑 `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aihub
    username: your_username
    password: your_password
```

### 3. 构建并运行

```bash
mvn clean package -DskipTests
java -jar target/aihub-backend-1.0.0.jar
```

或开发模式:

```bash
mvn spring-boot:run
```

服务将在 http://localhost:8080 启动。

## 默认账户

- 管理员: admin / admin123

## API 接口

### 认证

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/register | POST | 注册 |
| /api/auth/login | POST | 登录 |
| /api/auth/logout | POST | 登出 |
| /api/auth/me | GET | 获取当前用户 |

### API Key

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/keys | GET | 列出 Key |
| /api/keys | POST | 创建 Key |
| /api/keys/{id} | DELETE | 撤销 Key |

### 聊天

| 接口 | 方法 | 说明 |
|------|------|------|
| /v1/chat/completions | POST | 聊天补全 |
| /v1/models | GET | 模型列表 |

### 用量

| 接口 | 方法 | 说明 |
|------|------|------|
| /v1/account/usage | GET | 用量统计 |

### 管理员

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/admin/users | GET | 用户列表 |
| /api/admin/users/{id}/recharge | POST | 充值 |
| /api/admin/platform-keys | GET/POST/DELETE | 平台 Key 管理 |

## 地区路由

平台 Key 支持按地区配置:

- `CN` - 中国大陆
- `OVERSEAS` - 海外
- `GLOBAL` - 全球通用

用户地区自动探测，未配置时根据 IP 判断。

## 项目结构

```
java-backend/src/main/java/com/aihub/
├── AihubApplication.java       # 应用入口
├── config/                     # 配置类
│   ├── CorsConfig.java         # CORS 配置
│   ├── DataInitializer.java    # 数据初始化
│   ├── SecurityConfig.java      # 安全配置
│   └── WebClientConfig.java     # WebClient 配置
├── controller/                  # 控制器
│   ├── AdminController.java    # 管理员接口
│   ├── AuthController.java      # 认证接口
│   ├── ChatController.java      # 聊天接口
│   ├── HealthController.java    # 健康检查
│   ├── KeyController.java       # API Key 管理
│   └── UsageController.java     # 用量查询
├── dto/                         # 数据传输对象
│   ├── request/                # 请求 DTO
│   └── response/                # 响应 DTO
├── entity/                      # 实体类
│   ├── ApiKey.java              # API Key 实体
│   ├── ModelPrice.java          # 模型价格
│   ├── PlatformKey.java         # 平台 Key
│   ├── UsageLog.java            # 用量日志
│   └── User.java                # 用户
├── repository/                  # 数据仓库
├── security/                    # 安全相关
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   └── PasswordEncoder.java
├── service/                     # 业务服务
│   ├── AdminService.java        # 管理员服务
│   ├── AuthService.java         # 认证服务
│   ├── ChatService.java         # 聊天代理
│   ├── KeyService.java          # Key 管理
│   ├── RegionService.java       # 地区路由
│   └── UsageService.java        # 用量统计
└── util/                        # 工具类
    └── IpUtils.java             # IP 工具
```

## 模型定价

启动时自动初始化以下模型价格:

| 模型 ID | 模型名称 | 输入价格 | 输出价格 |
|---------|---------|---------|---------|
| gpt-4o | GPT-4o | $0.0025/1M | $0.01/1M |
| gpt-4o-mini | GPT-4o Mini | $0.00015/1M | $0.0006/1M |
| claude-opus-4-7 | Claude Opus 4 | $0.003/1M | $0.015/1M |
| deepseek-chat | DeepSeek Chat | $0.00014/1M | $0.00028/1M |
| deepseek-v3 | DeepSeek V3 | $0.00014/1M | $0.00028/1M |
| gemini-1.5-flash | Gemini 1.5 Flash | $0.000075/1M | $0.0003/1M |
