# AI API 中转平台 - 前后端对接设计

## 1. 概述

完成 React 前端与 Java Spring Boot 后端的完整对接，包括：
- JWT + HTTPOnly Cookie 认证
- 前后端 Docker 部署
- Cloudflare Workers API Key 自动分发

## 2. 技术选型

| 组件 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite |
| UI 组件库 | Tailwind CSS (已有) |
| 状态管理 | React Context + Hooks |
| 国际化 | i18next (已有) |
| 后端框架 | Spring Boot 3.2 + Spring Security 6 |
| 数据库 | MySQL 8.0 |
| 部署 | Docker + Docker Compose |

## 3. 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      用户浏览器                          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    React 前端 (5173)                     │
│                   Vite Dev Server                        │
│                         │                                │
│              ┌──────────┴──────────┐                    │
│              │    Vite Proxy       │                    │
│              │  /api → localhost:8080                    │
│              └──────────┬──────────┘                    │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼ (生产环境: Nginx → Java Backend)
┌─────────────────────────────────────────────────────────┐
│               Java Spring Boot Backend                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Spring Security 6                      │    │
│  │  - JWT in HTTPOnly Cookie                       │    │
│  │  - CSRF Protection (disabled for API)           │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │           REST API Endpoints                     │    │
│  │  /api/auth/* - 认证                              │    │
│  │  /api/keys/* - API Key 管理                      │    │
│  │  /api/chat/* - 聊天代理                          │    │
│  │  /api/usage/* - 使用统计                         │    │
│  │  /api/admin/* - 管理功能                         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    MySQL Database                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Cloudflare Workers                         │
│  - 读取后端 API Key                                     │
│  - D1 缓存 Key 列表                                     │
│  - 请求路由分发                                          │
└─────────────────────────────────────────────────────────┘
```

## 4. 认证设计

### 4.1 Spring Security 配置

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // API 禁用 CSRF
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(),
                           UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### 4.2 JWT Cookie 策略

| 功能 | 实现 |
|------|------|
| Token 生成 | 登录成功后生成 JWT |
| 存储位置 | HTTPOnly Secure Cookie (`access_token`) |
| Token 有效期 | 24 小时 |
| 刷新机制 | 每次 API 请求自动检查并延长 |

### 4.3 前端认证流程

```
登录流程：
1. 用户提交表单 → /api/auth/login
2. 后端验证 → 返回 JWT + 设置 Cookie
3. 前端跳转到 Dashboard

请求流程：
1. 请求自动带上 Cookie
2. 后端 JWT Filter 验证
3. 成功 → 返回数据，失败 → 401

登出流程：
1. 调用 /api/auth/logout
2. 后端清除 Cookie + 黑名单 Token
3. 前端跳转到登录页
```

## 5. API 对接清单

### 5.1 认证模块 (Auth)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 获取当前用户信息 |

### 5.2 API Key 模块 (Key)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/keys` | GET | 获取用户所有 Key |
| `/api/keys` | POST | 创建新 Key |
| `/api/keys/{id}` | DELETE | 删除 Key |
| `/api/keys/{id}/toggle` | PATCH | 启用/禁用 Key |

### 5.3 统计模块 (Usage)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/usage/stats` | GET | 获取使用统计 |
| `/api/usage/trend` | GET | 获取趋势数据 |
| `/api/usage/models` | GET | 获取模型分布 |

### 5.4 管理模块 (Admin)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/users` | GET | 获取用户列表 |
| `/api/admin/keys` | GET | 获取所有 Key |
| `/api/admin/sync` | POST | 同步 Key 到 Workers |

## 6. 前端页面清单

| 页面 | 路由 | 组件 | 状态 |
|------|------|------|------|
| 登录 | `/login` | Auth/Login.jsx | 需完善 |
| 注册 | `/register` | Auth/Register.jsx | 需完善 |
| Dashboard | `/` | Dashboard/index.jsx | 需完善 |
| API Keys | `/keys` | APIKeys/index.jsx | 需完善 |

## 7. Workers API Key 分发

### 7.1 架构

```
Java Backend (MySQL)
        │
        ▼ 定时同步 / API
        │
Cloudflare D1 Database
        │
        ▼ 读取
Cloudflare Workers
```

### 7.2 实现方式

1. **Java 后端**: 提供 `/api/admin/sync` 接口，导出 Key 到 Cloudflare D1
2. **D1 Database**: 存储 Key 列表、状态、用户信息
3. **Workers**: 读取 D1 验证请求

### 7.3 同步策略

- 后端创建/更新/删除 Key 时，自动触发同步
- 或定时任务同步（如每天凌晨）

## 8. Docker 部署配置

### 8.1 新建 docker-compose.yml (Java 后端)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: aihub-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: aihub
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build:
      context: ../java-backend
      dockerfile: Dockerfile
    container_name: aihub-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/aihub
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
    depends_on:
      - mysql
    networks:
      - aihub-network

volumes:
  mysql_data:

networks:
  aihub-network:
    driver: bridge
```

### 8.2 Java Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 9. 开发环境配置

### 9.1 Vite Proxy 配置 (vite.config.js)

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

### 9.2 环境变量 (.env)

```env
VITE_API_BASE_URL=/api
```

## 10. 实现步骤

### Phase 1: 后端调整
1. 修改 Spring Security 支持 JWT Cookie
2. 添加 CORS 配置
3. 实现注册/登录接口返回 Cookie
4. 添加登出接口清除 Cookie

### Phase 2: 前端对接
1. 创建 AuthContext 管理认证状态
2. 完善登录/注册页面
3. 配置 Axios 拦截器自动携带 Cookie
4. 对接 Dashboard 数据接口
5. 对接 API Key 管理接口

### Phase 3: Docker 部署
1. 创建 Java 后端 Dockerfile
2. 创建 Docker Compose 配置
3. 编写部署脚本

### Phase 4: Workers 同步
1. 设计 D1 数据库表结构
2. 实现后端同步接口
3. 配置 Workers 读取 D1

## 11. 验收标准

- [ ] 用户可以注册、登录、登出
- [ ] 登录后自动获取用户信息
- [ ] Dashboard 显示使用统计
- [ ] 可以创建、删除、启用/禁用 API Key
- [ ] Docker 环境可正常部署运行
- [ ] Workers 可同步获取 API Key
