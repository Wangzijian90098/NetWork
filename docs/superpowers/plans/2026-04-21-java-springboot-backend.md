# Java Spring Boot 后端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 Java Spring Boot + MySQL 重构后端，替代现有 Python Flask 实现，提供企业级稳定性的 AI API 中转平台。

**Architecture:** 分层架构 Controller → Service → Repository，使用 JPA 操作 MySQL，JWT + Cookie 认证，支持 OpenAI 兼容接口和地区智能路由。

**Tech Stack:** Java 17+, Spring Boot 3.x, Spring Data JPA, MySQL 8.x, Spring Security + JWT, WebClient (HTTP 代理)

---

## 文件结构

```
java-backend/
├── pom.xml                          # Maven 依赖
├── src/main/java/com/aihub/
│   ├── AihubApplication.java        # 启动类
│   ├── config/
│   │   ├── SecurityConfig.java      # Spring Security 配置
│   │   ├── CorsConfig.java         # CORS 配置
│   │   └── WebClientConfig.java    # HTTP 客户端配置
│   ├── controller/
│   │   ├── AuthController.java     # 认证接口
│   │   ├── KeyController.java      # API Key 管理
│   │   ├── ChatController.java     # 聊天代理
│   │   ├── UsageController.java    # 用量统计
│   │   └── AdminController.java    # 管理员接口
│   ├── service/
│   │   ├── AuthService.java       # 认证逻辑
│   │   ├── KeyService.java         # Key 管理
│   │   ├── ChatService.java        # 聊天代理 + 地区路由
│   │   ├── UsageService.java       # 用量统计
│   │   ├── AdminService.java       # 管理员功能
│   │   └── RegionService.java      # IP 归属地探测
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── ApiKeyRepository.java
│   │   ├── PlatformKeyRepository.java
│   │   ├── ModelPriceRepository.java
│   │   └── UsageLogRepository.java
│   ├── entity/
│   │   ├── User.java
│   │   ├── ApiKey.java
│   │   ├── PlatformKey.java
│   │   ├── ModelPrice.java
│   │   └── UsageLog.java
│   ├── dto/
│   │   ├── request/
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   └── ChatRequest.java
│   │   └── response/
│   │       ├── LoginResponse.java
│   │       └── ChatResponse.java
│   ├── security/
│   │   ├── JwtTokenProvider.java  # JWT 签发/验证
│   │   ├── JwtAuthenticationFilter.java
│   │   └── CookieAuthenticationFilter.java
│   └── util/
│       ├── IpUtils.java           # IP 获取工具
│       └── PasswordEncoder.java   # BCrypt
├── src/main/resources/
│   ├── application.yml            # 配置
│   └── schema.sql                  # 建表 SQL
└── src/test/java/
    └── com/aihub/
        └── *Test.java             # 单元测试
```

---

## Task 1: 项目初始化 - Maven 项目结构

**Files:**
- Create: `java-backend/pom.xml`
- Create: `java-backend/src/main/java/com/aihub/AihubApplication.java`
- Create: `java-backend/src/main/resources/application.yml`
- Create: `java-backend/src/main/resources/schema.sql`

- [ ] **Step 1: 创建 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <groupId>com.aihub</groupId>
    <artifactId>aihub-backend</artifactId>
    <version>1.0.0</version>
    <name>AIHub Backend</name>
    <description>AI API Gateway with Region Routing</description>

    <properties>
        <java.version>17</java.version>
        <jjwt.version>0.12.5</jjwt.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>

        <!-- MySQL -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建启动类**

```java
package com.aihub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AihubApplication {
    public static void main(String[] args) {
        SpringApplication.run(AihubApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 application.yml**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aihub?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
  jackson:
    property-naming-strategy: SNAKE_CASE
    default-property-inclusion: non_null

app:
  jwt:
    secret: aihubs-super-secret-key-change-in-production-min-32-chars
    expiration-ms: 604800000  # 7 days

logging:
  level:
    com.aihub: INFO
    org.hibernate.SQL: WARN
```

- [ ] **Step 4: 创建 schema.sql（备用建表脚本）**

```sql
CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,4) DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    region VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_key (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    key_name VARCHAR(100),
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS platform_key (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    provider VARCHAR(50) NOT NULL,
    key_token VARCHAR(255) NOT NULL,
    base_url VARCHAR(255),
    region VARCHAR(10) DEFAULT 'GLOBAL',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_price (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    model VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    price_per_1k_input DECIMAL(10,6) NOT NULL,
    price_per_1k_output DECIMAL(10,6) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usage_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    api_key_id BIGINT NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (api_key_id) REFERENCES api_key(id)
);
```

- [ ] **Step 5: 验证项目结构**

Run: `cd java-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add java-backend/
git commit -m "feat(java): scaffold Spring Boot backend project"
```

---

## Task 2: 实体类定义

**Files:**
- Create: `java-backend/src/main/java/com/aihub/entity/User.java`
- Create: `java-backend/src/main/java/com/aihub/entity/ApiKey.java`
- Create: `java-backend/src/main/java/com/aihub/entity/PlatformKey.java`
- Create: `java-backend/src/main/java/com/aihub/entity/ModelPrice.java`
- Create: `java-backend/src/main/java/com/aihub/entity/UsageLog.java`

- [ ] **Step 1: 创建 User 实体**

```java
package com.aihub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(precision = 10, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(length = 20)
    private String role = "user";

    @Column(length = 10)
    private String region;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 2: 创建 ApiKey 实体**

```java
package com.aihub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_key")
@Data
@NoArgsConstructor
public class ApiKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "key_name")
    private String keyName;

    @Column(unique = true, nullable = false)
    private String token;

    @Column(length = 20)
    private String status = "active";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
```

- [ ] **Step 3: 创建 PlatformKey 实体**

```java
package com.aihub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_key")
@Data
@NoArgsConstructor
public class PlatformKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "key_token", nullable = false)
    private String keyToken;

    @Column(name = "base_url")
    private String baseUrl;

    @Column(length = 10)
    private String region = "GLOBAL";

    @Column(length = 20)
    private String status = "active";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

- [ ] **Step 4: 创建 ModelPrice 实体**

```java
package com.aihub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "model_price")
@Data
@NoArgsConstructor
public class ModelPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String model;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "price_per_1k_input", precision = 10, scale = 6, nullable = false)
    private BigDecimal pricePer1kInput;

    @Column(name = "price_per_1k_output", precision = 10, scale = 6, nullable = false)
    private BigDecimal pricePer1kOutput;

    @Column
    private Boolean enabled = true;
}
```

- [ ] **Step 5: 创建 UsageLog 实体**

```java
package com.aihub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "usage_log")
@Data
@NoArgsConstructor
public class UsageLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "api_key_id", nullable = false)
    private Long apiKeyId;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "input_tokens")
    private Integer inputTokens = 0;

    @Column(name = "output_tokens")
    private Integer outputTokens = 0;

    @Column(precision = 10, scale = 6)
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "request_time")
    private LocalDateTime requestTime = LocalDateTime.now();

    @Column(name = "request_id", length = 64)
    private String requestId;
}
```

- [ ] **Step 6: 验证编译**

Run: `cd java-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 7: Commit**

```bash
git add java-backend/src/main/java/com/aihub/entity/
git commit -m "feat(java): add JPA entity classes"
```

---

## Task 3: Repository 层

**Files:**
- Create: `java-backend/src/main/java/com/aihub/repository/UserRepository.java`
- Create: `java-backend/src/main/java/com/aihub/repository/ApiKeyRepository.java`
- Create: `java-backend/src/main/java/com/aihub/repository/PlatformKeyRepository.java`
- Create: `java-backend/src/main/java/com/aihub/repository/ModelPriceRepository.java`
- Create: `java-backend/src/main/java/com/aihub/repository/UsageLogRepository.java`

- [ ] **Step 1: 创建 UserRepository**

```java
package com.aihub.repository;

import com.aihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

- [ ] **Step 2: 创建 ApiKeyRepository**

```java
package com.aihub.repository;

import com.aihub.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByUserId(Long userId);
    Optional<ApiKey> findByToken(String token);
}
```

- [ ] **Step 3: 创建 PlatformKeyRepository**

```java
package com.aihub.repository;

import com.aihub.entity.PlatformKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformKeyRepository extends JpaRepository<PlatformKey, Long> {
    List<PlatformKey> findByProviderAndStatus(String provider, String status);
    List<PlatformKey> findByProviderAndRegionAndStatus(String provider, String region, String status);
    List<PlatformKey> findByProviderAndRegionOrRegionAndStatus(
        String provider1, String region1, String region2, String status);
}
```

- [ ] **Step 4: 创建 ModelPriceRepository**

```java
package com.aihub.repository;

import com.aihub.entity.ModelPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ModelPriceRepository extends JpaRepository<ModelPrice, Long> {
    Optional<ModelPrice> findByModelAndEnabledTrue(String model);
    List<ModelPrice> findByEnabledTrue();
}
```

- [ ] **Step 5: 创建 UsageLogRepository**

```java
package com.aihub.repository;

import com.aihub.entity.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {
    List<UsageLog> findByUserIdAndRequestTimeAfter(Long userId, LocalDateTime after);

    @Query("SELECT COALESCE(SUM(u.inputTokens), 0) FROM UsageLog u WHERE u.userId = :userId AND u.requestTime >= :after")
    Integer sumInputTokens(@Param("userId") Long userId, @Param("after") LocalDateTime after);

    @Query("SELECT COALESCE(SUM(u.outputTokens), 0) FROM UsageLog u WHERE u.userId = :userId AND u.requestTime >= :after")
    Integer sumOutputTokens(@Param("userId") Long userId, @Param("after") LocalDateTime after);

    @Query("SELECT COALESCE(SUM(u.cost), 0) FROM UsageLog u WHERE u.userId = :userId AND u.requestTime >= :after")
    java.math.BigDecimal sumCost(@Param("userId") Long userId, @Param("after") LocalDateTime after);
}
```

- [ ] **Step 6: Commit**

```bash
git add java-backend/src/main/java/com/aihub/repository/
git commit -m "feat(java): add JPA repository interfaces"
```

---

## Task 4: DTO 定义

**Files:**
- Create: `java-backend/src/main/java/com/aihub/dto/request/LoginRequest.java`
- Create: `java-backend/src/main/java/com/aihub/dto/request/RegisterRequest.java`
- Create: `java-backend/src/main/java/com/aihub/dto/request/CreateKeyRequest.java`
- Create: `java-backend/src/main/java/com/aihub/dto/request/ChatRequest.java`
- Create: `java-backend/src/main/java/com/aihub/dto/response/ApiResponse.java`
- Create: `java-backend/src/main/java/com/aihub/dto/response/UserDto.java`

- [ ] **Step 1: 创建请求 DTO**

```java
package com.aihub.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, message = "密码长度不能少于6位")
    private String password;

    private String region;  // CN, OVERSEAS, or null
}
```

```java
package com.aihub.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "密码不能为空")
    private String password;
}
```

```java
package com.aihub.dto.request;

import lombok.Data;

@Data
public class CreateKeyRequest {
    private String name = "My API Key";
}
```

```java
package com.aihub.dto.request;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {
    private String model;
    private List<Map<String, String>> messages;
    private Double temperature;
    private Integer maxTokens;
}
```

- [ ] **Step 2: 创建响应 DTO**

```java
package com.aihub.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

```java
package com.aihub.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UserDto {
    private Long id;
    private String email;
    private BigDecimal balance;
    private String role;
    private String region;
}
```

- [ ] **Step 3: Commit**

```bash
git add java-backend/src/main/java/com/aihub/dto/
git commit -m "feat(java): add DTO classes"
```

---

## Task 5: 安全配置 - JWT 和密码加密

**Files:**
- Create: `java-backend/src/main/java/com/aihub/security/PasswordEncoder.java`
- Create: `java-backend/src/main/java/com/aihub/security/JwtTokenProvider.java`
- Create: `java-backend/src/main/java/com/aihub/config/SecurityConfig.java`
- Create: `java-backend/src/main/java/com/aihub/config/CorsConfig.java`

- [ ] **Step 1: 创建 PasswordEncoder**

```java
package com.aihub.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordEncoder {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public String encode(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String encodedPassword) {
        return encoder.matches(rawPassword, encodedPassword);
    }
}
```

- [ ] **Step 2: 创建 JwtTokenProvider**

```java
package com.aihub.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

- [ ] **Step 3: 创建 SecurityConfig**

```java
package com.aihub.config;

import com.aihub.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/health", "/v1/models").permitAll()
                .requestMatchers("/v1/chat/**").permitAll()  // API Key auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

- [ ] **Step 4: 创建 CorsConfig**

```java
package com.aihub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

- [ ] **Step 5: 创建 JwtAuthenticationFilter**

```java
package com.aihub.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserId(token);
            var claims = jwtTokenProvider.getClaims(token);
            String role = claims.get("role", String.class);

            var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
            var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // 1. 从 Cookie 获取
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        // 2. 从 Authorization Header 获取
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add java-backend/src/main/java/com/aihub/security/ java-backend/src/main/java/com/aihub/config/
git commit -m "feat(java): add JWT and Security configuration"
```

---

## Task 6: 认证服务与控制器

**Files:**
- Create: `java-backend/src/main/java/com/aihub/service/AuthService.java`
- Create: `java-backend/src/main/java/com/aihub/controller/AuthController.java`

- [ ] **Step 1: 创建 AuthService**

```java
package com.aihub.service;

import com.aihub.dto.request.LoginRequest;
import com.aihub.dto.request.RegisterRequest;
import com.aihub.dto.response.UserDto;
import com.aihub.entity.User;
import com.aihub.repository.UserRepository;
import com.aihub.security.JwtTokenProvider;
import com.aihub.security.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public boolean register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return false;
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setBalance(new BigDecimal("10.00"));  // 新用户送 $10

        String region = request.getRegion();
        if ("CN".equals(region) || "OVERSEAS".equals(region)) {
            user.setRegion(region);
        }

        userRepository.save(user);
        return true;
    }

    public Optional<String> login(LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .map(user -> jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole()));
    }

    public Optional<UserDto> getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .map(this::toDto);
    }

    @Transactional
    public void updateRegion(Long userId, String region) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setRegion(region);
            userRepository.save(user);
        });
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setBalance(user.getBalance());
        dto.setRole(user.getRole());
        dto.setRegion(user.getRegion());
        return dto;
    }
}
```

- [ ] **Step 2: 创建 AuthController**

```java
package com.aihub.controller;

import com.aihub.dto.request.LoginRequest;
import com.aihub.dto.request.RegisterRequest;
import com.aihub.dto.response.ApiResponse;
import com.aihub.dto.response.UserDto;
import com.aihub.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        if (authService.register(request)) {
            return ResponseEntity.ok(ApiResponse.success("注册成功"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("该邮箱已注册"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        return authService.login(request)
                .map(token -> {
                    Cookie cookie = new Cookie("token", token);
                    cookie.setHttpOnly(true);
                    cookie.setPath("/");
                    cookie.setMaxAge(7 * 24 * 3600);
                    response.addCookie(cookie);

                    Map<String, Object> data = Map.of(
                            "token", token,
                            "user", authService.getCurrentUser(
                                    authService.getClass().getDeclaredMethods()[0].getDeclaringClass()
                            ).orElse(null)
                    );
                    return ResponseEntity.ok(ApiResponse.success(data));
                })
                .orElse(ResponseEntity.status(401).body(ApiResponse.error("邮箱或密码错误")));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("已退出登录"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
        }
        Long userId = (Long) auth.getPrincipal();
        return authService.getCurrentUser(userId)
                .map(user -> ResponseEntity.ok(ApiResponse.success(user)))
                .orElse(ResponseEntity.notFound().build());
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add java-backend/src/main/java/com/aihub/service/AuthService.java java-backend/src/main/java/com/aihub/controller/AuthController.java
git commit -m "feat(java): add authentication service and controller"
```

---

## Task 7: API Key 管理服务与控制器

**Files:**
- Create: `java-backend/src/main/java/com/aihub/service/KeyService.java`
- Create: `java-backend/src/main/java/com/aihub/controller/KeyController.java`

- [ ] **Step 1: 创建 KeyService**

```java
package com.aihub.service;

import com.aihub.entity.ApiKey;
import com.aihub.repository.ApiKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class KeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public KeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    public List<Map<String, Object>> getKeysByUser(Long userId) {
        return apiKeyRepository.findByUserId(userId).stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> createKey(Long userId, String name) {
        ApiKey key = new ApiKey();
        key.setUserId(userId);
        key.setKeyName(name);
        key.setToken(generateToken());
        key.setStatus("active");
        return toMap(apiKeyRepository.save(key));
    }

    @Transactional
    public boolean revokeKey(Long userId, Long keyId) {
        return apiKeyRepository.findById(keyId)
                .filter(key -> key.getUserId().equals(userId) && "active".equals(key.getStatus()))
                .map(key -> {
                    key.setStatus("revoked");
                    apiKeyRepository.save(key);
                    return true;
                })
                .orElse(false);
    }

    public Map<String, Object> validateKey(String token) {
        return apiKeyRepository.findByToken(token)
                .map(key -> {
                    if (!"active".equals(key.getStatus())) {
                        return null;
                    }
                    return Map.of(
                            "id", key.getId(),
                            "userId", key.getUserId(),
                            "status", key.getStatus()
                    );
                })
                .orElse(null);
    }

    private String generateToken() {
        byte[] bytes = new byte[16];
        secureRandom.nextBytes(bytes);
        return "sk-aihub-" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private Map<String, Object> toMap(ApiKey key) {
        return Map.of(
                "id", key.getId(),
                "name", key.getKeyName() != null ? key.getKeyName() : "API Key",
                "token", key.getToken(),
                "status", key.getStatus(),
                "createdAt", key.getCreatedAt().toString()
        );
    }
}
```

- [ ] **Step 2: 创建 KeyController**

```java
package com.aihub.controller;

import com.aihub.dto.request.CreateKeyRequest;
import com.aihub.dto.response.ApiResponse;
import com.aihub.service.KeyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/keys")
public class KeyController {

    private final KeyService keyService;

    public KeyController(KeyService keyService) {
        this.keyService = keyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listKeys(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(keyService.getKeysByUser(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createKey(
            @RequestBody CreateKeyRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        String name = request.getName() != null ? request.getName() : "My API Key";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(keyService.createKey(userId, name)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeKey(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        if (keyService.revokeKey(userId, id)) {
            return ResponseEntity.ok(ApiResponse.success("Key 已撤销"));
        }
        return ResponseEntity.notFound().build();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add java-backend/src/main/java/com/aihub/service/KeyService.java java-backend/src/main/java/com/aihub/controller/KeyController.java
git commit -m "feat(java): add API key management service and controller"
```

---

## Task 8: 地区路由服务

**Files:**
- Create: `java-backend/src/main/java/com/aihub/util/IpUtils.java`
- Create: `java-backend/src/main/java/com/aihub/service/RegionService.java`

- [ ] **Step 1: 创建 IpUtils**

```java
package com.aihub.util;

import jakarta.servlet.http.HttpServletRequest;

public class IpUtils {

    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        // 1. X-Forwarded-For
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }

        // 2. X-Real-IP
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp.trim();
        }

        // 3. RemoteAddr
        return request.getRemoteAddr();
    }
}
```

- [ ] **Step 2: 创建 RegionService（简化版 - 使用在线 API）**

```java
package com.aihub.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class RegionService {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getRegion(String ip) {
        // 跳过本地/内网 IP
        if (ip == null || ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") ||
                ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
            return "OVERSEAS";
        }

        try {
            String url = "http://ip-api.com/json/" + ip + "?fields=countryCode";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body();

            if (body.contains("\"countryCode\":\"CN\"")) {
                return "CN";
            }
            return "OVERSEAS";
        } catch (Exception e) {
            return "OVERSEAS";  // 默认值
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add java-backend/src/main/java/com/aihub/util/IpUtils.java java-backend/src/main/java/com/aihub/service/RegionService.java
git commit -m "feat(java): add IP region detection service"
```

---

## Task 9: 聊天代理服务（核心地区路由）

**Files:**
- Create: `java-backend/src/main/java/com/aihub/service/ChatService.java`
- Create: `java-backend/src/main/java/com/aihub/controller/ChatController.java`
- Create: `java-backend/src/main/java/com/aihub/config/WebClientConfig.java`

- [ ] **Step 1: 创建 WebClientConfig**

```java
package com.aihub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }
}
```

- [ ] **Step 2: 创建 ChatService**

```java
package com.aihub.service;

import com.aihub.dto.request.ChatRequest;
import com.aihub.entity.ApiKey;
import com.aihub.entity.ModelPrice;
import com.aihub.entity.PlatformKey;
import com.aihub.entity.User;
import com.aihub.repository.ApiKeyRepository;
import com.aihub.repository.ModelPriceRepository;
import com.aihub.repository.PlatformKeyRepository;
import com.aihub.repository.UserRepository;
import com.aihub.repository.UsageLogRepository;
import com.aihub.util.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ChatService {

    private static final Map<String, String> PROVIDER_MAP = Map.ofEntries(
            Map.entry("gpt-4o", "openai"),
            Map.entry("gpt-4o-mini", "openai"),
            Map.entry("gpt-4-turbo", "openai"),
            Map.entry("claude-opus-4-7", "anthropic"),
            Map.entry("claude-3-opus", "anthropic"),
            Map.entry("deepseek-chat", "deepseek"),
            Map.entry("gemini-1.5-pro", "google"),
            Map.entry("gemini-1.5-flash", "google"),
            Map.entry("moonshot-v1-8k", "moonshot"),
            Map.entry("glm-4", "zhipu"),
            Map.entry("qwen-plus", "alibaba")
    );

    private static final Map<String, String> BASE_URLS = Map.of(
            "openai", "https://api.openai.com/v1",
            "anthropic", "https://api.anthropic.com/v1",
            "deepseek", "https://api.deepseek.com/v1",
            "google", "https://generativelanguage.googleapis.com/v1beta",
            "moonshot", "https://api.moonshot.cn/v1",
            "zhipu", "https://open.anthropic.com/api/paas/v4",
            "alibaba", "https://api.anthropic.com/compatible-mode/v1"
    );

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final PlatformKeyRepository platformKeyRepository;
    private final ModelPriceRepository modelPriceRepository;
    private final UsageLogRepository usageLogRepository;
    private final RegionService regionService;
    private final WebClient webClient;

    public ChatService(ApiKeyRepository apiKeyRepository, UserRepository userRepository,
                       PlatformKeyRepository platformKeyRepository, ModelPriceRepository modelPriceRepository,
                       UsageLogRepository usageLogRepository, RegionService regionService,
                       WebClient webClient) {
        this.apiKeyRepository = apiKeyRepository;
        this.userRepository = userRepository;
        this.platformKeyRepository = platformKeyRepository;
        this.modelPriceRepository = modelPriceRepository;
        this.usageLogRepository = usageLogRepository;
        this.regionService = regionService;
        this.webClient = webClient;
    }

    public record ChatResult(Map<String, Object> result, int statusCode, String error) {}

    public ChatResult proxyChat(ChatRequest request, String bearerToken, HttpServletRequest httpRequest) {
        // 1. 验证 API Key
        if (!bearerToken.startsWith("sk-aihub-")) {
            return new ChatResult(null, 401, "Invalid API key format");
        }

        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByToken(bearerToken);
        if (apiKeyOpt.isEmpty()) {
            return new ChatResult(null, 401, "Invalid API key");
        }

        ApiKey apiKey = apiKeyOpt.get();
        if (!"active".equals(apiKey.getStatus())) {
            return new ChatResult(null, 401, "API key is inactive");
        }

        Long userId = apiKey.getUserId();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return new ChatResult(null, 401, "User not found");
        }

        User user = userOpt.get();
        String model = request.getModel();

        // 2. 获取/探测用户地区
        String region = user.getRegion();
        if (region == null) {
            String clientIp = IpUtils.getClientIp(httpRequest);
            region = regionService.getRegion(clientIp);
            user.setRegion(region);
            userRepository.save(user);
        }

        // 3. 获取模型价格
        Optional<ModelPrice> priceOpt = modelPriceRepository.findByModelAndEnabledTrue(model);
        if (priceOpt.isEmpty()) {
            return new ChatResult(null, 422, "Model not found or disabled: " + model);
        }
        ModelPrice price = priceOpt.get();

        // 4. 估算费用并检查余额
        int estimatedTokens = (request.getMessages() != null ? request.getMessages().size() : 0) * 50;
        BigDecimal estimatedCost = BigDecimal.valueOf(estimatedTokens / 1000.0)
                .multiply(price.getPricePer1kInput().add(price.getPricePer1kOutput()));

        if (user.getBalance().compareTo(estimatedCost) < 0) {
            return new ChatResult(null, 402, "Insufficient balance");
        }

        // 5. 获取 provider 并选择平台 Key
        String provider = PROVIDER_MAP.getOrDefault(model, null);
        if (provider == null) {
            return new ChatResult(null, 422, "Provider not configured for model: " + model);
        }

        PlatformKey platformKey = selectPlatformKey(provider, region);
        if (platformKey == null) {
            return new ChatResult(null, 503, "No available platform key for this region");
        }

        // 6. 构建请求
        String baseUrl = platformKey.getBaseUrl();
        if (baseUrl == null || baseUrl.isEmpty()) {
            baseUrl = BASE_URLS.getOrDefault(provider, "");
        }

        String upstreamUrl;
        Map<String, Object> upstreamBody = new HashMap<>();
        upstreamBody.put("model", model);
        upstreamBody.put("messages", request.getMessages());

        if (request.getTemperature() != null) {
            upstreamBody.put("temperature", request.getTemperature());
        }
        if (request.getMaxTokens() != null) {
            upstreamBody.put("max_tokens", request.getMaxTokens());
        }

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Authorization", "Bearer " + platformKey.getKeyToken());

        if ("anthropic".equals(provider)) {
            upstreamUrl = baseUrl + "/messages";
            headers.put("x-api-key", platformKey.getKeyToken());
            headers.put("anthropic-version", "2023-06-01");
            headers.remove("Authorization");
        } else {
            upstreamUrl = baseUrl + "/chat/completions";
        }

        // 7. 发送请求
        try {
            String responseBody = webClient.post()
                    .uri(upstreamUrl)
                    .headers(h -> h.setAll(headers))
                    .bodyValue(upstreamBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(60));

            // 8. 解析用量并扣费
            Map<String, Object> responseMap = parseResponse(responseBody);
            Map<String, Object> usage = (Map<String, Object>) responseMap.getOrDefault("usage", Map.of());
            int inputTokens = getIntValue(usage.get("prompt_tokens"));
            int outputTokens = getIntValue(usage.get("completion_tokens"));

            BigDecimal inputCost = BigDecimal.valueOf(inputTokens / 1000.0).multiply(price.getPricePer1kInput());
            BigDecimal outputCost = BigDecimal.valueOf(outputTokens / 1000.0).multiply(price.getPricePer1kOutput());
            BigDecimal actualCost = inputCost.add(outputCost).setScale(6, RoundingMode.HALF_UP);

            // 9. 扣费
            if (deductBalance(userId, actualCost)) {
                // 10. 记录用量
                recordUsage(userId, apiKey.getId(), model, inputTokens, outputTokens, actualCost);
                responseMap.put("id", "chatcmpl-" + UUID.randomUUID().toString().substring(0, 8));
            }

            return new ChatResult(responseMap, 200, null);

        } catch (WebClientResponseException e) {
            refundBalance(userId, estimatedCost);
            return new ChatResult(null, e.getStatusCode().value(), "Upstream error: " + e.getMessage());
        } catch (Exception e) {
            refundBalance(userId, estimatedCost);
            return new ChatResult(null, 502, "Request failed: " + e.getMessage());
        }
    }

    private PlatformKey selectPlatformKey(String provider, String region) {
        // 1. 精确匹配 region
        List<PlatformKey> keys = platformKeyRepository.findByProviderAndRegionAndStatus(provider, region, "active");
        if (!keys.isEmpty()) {
            return keys.get(0);
        }

        // 2. GLOBAL 降级
        keys = platformKeyRepository.findByProviderAndRegionAndStatus(provider, "GLOBAL", "active");
        if (!keys.isEmpty()) {
            return keys.get(0);
        }

        return null;
    }

    private boolean deductBalance(Long userId, BigDecimal cost) {
        int updated = userRepository.deductBalance(userId, cost);
        return updated > 0;
    }

    private void refundBalance(Long userId, BigDecimal cost) {
        userRepository.addBalance(userId, cost);
    }

    private void recordUsage(Long userId, Long apiKeyId, String model,
                             int inputTokens, int outputTokens, BigDecimal cost) {
        com.aihub.entity.UsageLog log = new com.aihub.entity.UsageLog();
        log.setUserId(userId);
        log.setApiKeyId(apiKeyId);
        log.setModel(model);
        log.setInputTokens(inputTokens);
        log.setOutputTokens(outputTokens);
        log.setCost(cost);
        log.setRequestId("chatcmpl-" + UUID.randomUUID().toString().substring(0, 8));
        usageLogRepository.save(log);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseResponse(String body) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(body, Map.class);
        } catch (Exception e) {
            return Map.of("error", Map.of("message", body));
        }
    }

    private int getIntValue(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
    }
}
```

- [ ] **Step 3: 添加 UserRepository 的余额操作方法**

```java
// 在 UserRepository.java 中添加:
@Modifying
@Query("UPDATE User u SET u.balance = u.balance - :cost WHERE u.id = :userId AND u.balance >= :cost")
int deductBalance(@Param("userId") Long userId, @Param("cost") BigDecimal cost);

@Modifying
@Query("UPDATE User u SET u.balance = u.balance + :amount WHERE u.id = :userId")
int addBalance(@Param("userId") Long userId, @Param("amount") BigDecimal amount);
```

- [ ] **Step 4: 创建 ChatController**

```java
package com.aihub.controller;

import com.aihub.dto.request.ChatRequest;
import com.aihub.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/v1/chat/completions")
    public ResponseEntity<?> chatCompletions(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChatRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        if (!authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", Map.of("message", "Missing Authorization header", "type", "invalid_request_error")));
        }

        String bearerToken = authHeader.substring(7);
        ChatService.ChatResult result = chatService.proxyChat(request, bearerToken, httpRequest);

        if (result.error() != null) {
            return ResponseEntity.status(result.statusCode())
                    .body(Map.of("error", Map.of("message", result.error(), "type", "invalid_request_error")));
        }

        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(result.result());
    }

    @GetMapping("/v1/models")
    public ResponseEntity<?> listModels() {
        // 返回模型列表（可从数据库或静态配置获取）
        return ResponseEntity.ok(Map.of(
                "object", "list",
                "data", java.util.List.of(
                        Map.of("id", "gpt-4o", "object", "model", "owned_by", "openai"),
                        Map.of("id", "gpt-4o-mini", "object", "model", "owned_by", "openai"),
                        Map.of("id", "claude-opus-4-7", "object", "model", "owned_by", "anthropic"),
                        Map.of("id", "deepseek-chat", "object", "model", "owned_by", "deepseek")
                )
        ));
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add java-backend/src/main/java/com/aihub/service/ChatService.java java-backend/src/main/java/com/aihub/controller/ChatController.java java-backend/src/main/java/com/aihub/config/WebClientConfig.java
git commit -m "feat(java): add chat proxy service with region-based routing"
```

---

## Task 10: 用量统计与管理员接口

**Files:**
- Create: `java-backend/src/main/java/com/aihub/service/UsageService.java`
- Create: `java-backend/src/main/java/com/aihub/controller/UsageController.java`
- Create: `java-backend/src/main/java/com/aihub/service/AdminService.java`
- Create: `java-backend/src/main/java/com/aihub/controller/AdminController.java`

- [ ] **Step 1: 创建 UsageService**

```java
package com.aihub.service;

import com.aihub.repository.UsageLogRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UsageService {

    private final UsageLogRepository usageLogRepository;

    public UsageService(UsageLogRepository usageLogRepository) {
        this.usageLogRepository = usageLogRepository;
    }

    public Map<String, Object> getUsageSummary(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        Integer inputTokens = usageLogRepository.sumInputTokens(userId, since);
        Integer outputTokens = usageLogRepository.sumOutputTokens(userId, since);
        BigDecimal totalCost = usageLogRepository.sumCost(userId, since);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRequests", usageLogRepository.findByUserIdAndRequestTimeAfter(userId, since).size());
        summary.put("totalInputTokens", inputTokens != null ? inputTokens : 0);
        summary.put("totalOutputTokens", outputTokens != null ? outputTokens : 0);
        summary.put("totalCost", totalCost != null ? totalCost : BigDecimal.ZERO);

        return summary;
    }
}
```

- [ ] **Step 2: 创建 UsageController**

```java
package com.aihub.controller;

import com.aihub.dto.response.ApiResponse;
import com.aihub.service.UsageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/account")
public class UsageController {

    private final UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsage(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        Long userId = (Long) auth.getPrincipal();
        Map<String, Object> summary = usageService.getUsageSummary(userId, days);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "period", "last_" + days + "_days",
                "summary", summary
        )));
    }
}
```

- [ ] **Step 3: 创建 AdminService**

```java
package com.aihub.service;

import com.aihub.entity.PlatformKey;
import com.aihub.repository.PlatformKeyRepository;
import com.aihub.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PlatformKeyRepository platformKeyRepository;

    public AdminService(UserRepository userRepository, PlatformKeyRepository platformKeyRepository) {
        this.userRepository = userRepository;
        this.platformKeyRepository = platformKeyRepository;
    }

    public List<Map<String, Object>> getUsers() {
        return userRepository.findAll().stream()
                .map(u -> Map.of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "balance", u.getBalance(),
                        "role", u.getRole(),
                        "region", u.getRegion() != null ? u.getRegion() : ""
                ))
                .toList();
    }

    @Transactional
    public boolean rechargeUser(Long userId, BigDecimal amount) {
        Optional<com.aihub.entity.User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty() || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        return userRepository.addBalance(userId, amount) > 0;
    }

    public List<Map<String, Object>> getPlatformKeys() {
        return platformKeyRepository.findAll().stream()
                .map(pk -> Map.of(
                        "id", pk.getId(),
                        "provider", pk.getProvider(),
                        "keyToken", pk.getKeyToken(),
                        "baseUrl", pk.getBaseUrl() != null ? pk.getBaseUrl() : "",
                        "region", pk.getRegion(),
                        "status", pk.getStatus()
                ))
                .toList();
    }

    @Transactional
    public Map<String, Object> addPlatformKey(String provider, String keyToken, String baseUrl, String region) {
        PlatformKey pk = new PlatformKey();
        pk.setProvider(provider);
        pk.setKeyToken(keyToken);
        pk.setBaseUrl(baseUrl);
        pk.setRegion(region != null ? region : "GLOBAL");
        pk.setStatus("active");
        return Map.of(
                "id", platformKeyRepository.save(pk).getId(),
                "provider", pk.getProvider()
        );
    }

    @Transactional
    public boolean deletePlatformKey(Long keyId) {
        Optional<PlatformKey> pkOpt = platformKeyRepository.findById(keyId);
        if (pkOpt.isEmpty()) return false;
        platformKeyRepository.delete(pkOpt.get());
        return true;
    }
}
```

- [ ] **Step 4: 创建 AdminController**

```java
package com.aihub.controller;

import com.aihub.dto.response.ApiResponse;
import com.aihub.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers()));
    }

    @PostMapping("/users/{userId}/recharge")
    public ResponseEntity<ApiResponse<Void>> recharge(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body) {

        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        if (adminService.rechargeUser(userId, amount)) {
            return ResponseEntity.ok(ApiResponse.success("充值成功"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("充值失败"));
    }

    @GetMapping("/platform-keys")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPlatformKeys() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPlatformKeys()));
    }

    @PostMapping("/platform-keys")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addPlatformKey(@RequestBody Map<String, Object> body) {
        String provider = body.get("provider").toString();
        String keyToken = body.get("key_token").toString();
        String baseUrl = body.getOrDefault("base_url", "").toString();
        String region = body.getOrDefault("region", "GLOBAL").toString();

        Map<String, Object> result = adminService.addPlatformKey(provider, keyToken, baseUrl, region);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    @DeleteMapping("/platform-keys/{keyId}")
    public ResponseEntity<ApiResponse<Void>> deletePlatformKey(@PathVariable Long keyId) {
        if (adminService.deletePlatformKey(keyId)) {
            return ResponseEntity.ok(ApiResponse.success("已删除"));
        }
        return ResponseEntity.notFound().build();
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add java-backend/src/main/java/com/aihub/service/UsageService.java java-backend/src/main/java/com/aihub/service/AdminService.java java-backend/src/main/java/com/aihub/controller/UsageController.java java-backend/src/main/java/com/aihub/controller/AdminController.java
git commit -m "feat(java): add usage statistics and admin endpoints"
```

---

## Task 11: 健康检查与测试

**Files:**
- Create: `java-backend/src/main/java/com/aihub/controller/HealthController.java`
- Create: `java-backend/src/test/java/com/aihub/AihubApplicationTests.java`
- Create: `java-backend/src/test/java/com/aihub/service/AuthServiceTest.java`

- [ ] **Step 1: 创建 HealthController**

```java
package com.aihub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "aihubs-backend-java"
        ));
    }
}
```

- [ ] **Step 2: 创建基本测试**

```java
package com.aihub;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class AihubApplicationTests {

    @Test
    void contextLoads() {
        // 验证 Spring 上下文可以正常加载
    }
}
```

- [ ] **Step 3: 创建 application-test.yml**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    database-platform: org.hibernate.dialect.H2Dialect
  h2:
    console:
      enabled: false
```

- [ ] **Step 4: 创建 AuthServiceTest**

```java
package com.aihub.service;

import com.aihub.dto.request.LoginRequest;
import com.aihub.dto.request.RegisterRequest;
import com.aihub.entity.User;
import com.aihub.repository.UserRepository;
import com.aihub.security.JwtTokenProvider;
import com.aihub.security.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_shouldCreateUser() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        boolean result = authService.register(request);

        assertTrue(result);
        assertTrue(userRepository.existsByEmail("test@example.com"));
    }

    @Test
    void register_shouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        authService.register(request);
        boolean result = authService.register(request);

        assertFalse(result);
    }

    @Test
    void register_shouldAcceptRegion() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("cn@example.com");
        request.setPassword("password123");
        request.setRegion("CN");

        authService.register(request);

        Optional<User> user = userRepository.findByEmail("cn@example.com");
        assertTrue(user.isPresent());
        assertEquals("CN", user.get().getRegion());
    }

    @Test
    void login_shouldReturnToken() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("login@example.com");
        registerRequest.setPassword("password123");
        authService.register(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("login@example.com");
        loginRequest.setPassword("password123");

        Optional<String> token = authService.login(loginRequest);

        assertTrue(token.isPresent());
        assertTrue(token.get().startsWith("eyJ"));
    }

    @Test
    void login_shouldRejectWrongPassword() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("wrong@example.com");
        registerRequest.setPassword("password123");
        authService.register(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("wrong@example.com");
        loginRequest.setPassword("wrongpassword");

        Optional<String> token = authService.login(loginRequest);

        assertTrue(token.isEmpty());
    }
}
```

- [ ] **Step 5: 运行测试**

Run: `cd java-backend && mvn test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add java-backend/src/test/
git commit -m "test(java): add unit tests for auth service"
```

---

## Task 12: 数据初始化与文档

**Files:**
- Create: `java-backend/src/main/java/com/aihub/config/DataInitializer.java`
- Create: `java-backend/README.md`

- [ ] **Step 1: 创建 DataInitializer（初始化默认数据和管理员）**

```java
package com.aihub.config;

import com.aihub.entity.ModelPrice;
import com.aihub.entity.PlatformKey;
import com.aihub.entity.User;
import com.aihub.repository.ModelPriceRepository;
import com.aihub.repository.PlatformKeyRepository;
import com.aihub.repository.UserRepository;
import com.aihub.security.PasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ModelPriceRepository modelPriceRepository;
    private final PlatformKeyRepository platformKeyRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, ModelPriceRepository modelPriceRepository,
                           PlatformKeyRepository platformKeyRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.modelPriceRepository = modelPriceRepository;
        this.platformKeyRepository = platformKeyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 初始化管理员
        if (!userRepository.findByEmail("admin@aihubs.com").isPresent()) {
            User admin = new User();
            admin.setEmail("admin@aihubs.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setBalance(new BigDecimal("9999.00"));
            admin.setRole("admin");
            userRepository.save(admin);
            System.out.println("[DB] Default admin created: admin@aihubs.com / admin123");
        }

        // 初始化模型价格
        if (modelPriceRepository.count() == 0) {
            List<ModelPrice> models = List.of(
                    createModel("gpt-4o", "openai", 0.0025, 0.01),
                    createModel("gpt-4o-mini", "openai", 0.00015, 0.0006),
                    createModel("claude-opus-4-7", "anthropic", 0.003, 0.015),
                    createModel("deepseek-chat", "deepseek", 0.00014, 0.00028),
                    createModel("gemini-1.5-flash", "google", 0.000075, 0.0003)
            );
            modelPriceRepository.saveAll(models);
            System.out.println("[DB] Model prices initialized");
        }
    }

    private ModelPrice createModel(String model, String provider, double input, double output) {
        ModelPrice mp = new ModelPrice();
        mp.setModel(model);
        mp.setProvider(provider);
        mp.setPricePer1kInput(BigDecimal.valueOf(input));
        mp.setPricePer1kOutput(BigDecimal.valueOf(output));
        mp.setEnabled(true);
        return mp;
    }
}
```

- [ ] **Step 2: 创建 README.md**

```markdown
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

- 管理员: admin@aihubs.com / admin123

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
```

- [ ] **Step 3: Commit**

```bash
git add java-backend/src/main/java/com/aihub/config/DataInitializer.java java-backend/README.md
git commit -m "feat(java): add data initializer and documentation"
```

---

## 实施检查清单

- [ ] Task 1: Maven 项目结构
- [ ] Task 2: 实体类定义
- [ ] Task 3: Repository 层
- [ ] Task 4: DTO 定义
- [ ] Task 5: 安全配置 (JWT + Security)
- [ ] Task 6: 认证服务与控制器
- [ ] Task 7: API Key 管理
- [ ] Task 8: 地区路由服务
- [ ] Task 9: 聊天代理服务
- [ ] Task 10: 用量统计与管理员
- [ ] Task 11: 测试
- [ ] Task 12: 数据初始化

---

## 依赖信息

| 依赖 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2.5 | Web 框架 |
| Spring Data JPA | 3.x | ORM |
| MySQL Connector | 8.x | MySQL 驱动 |
| JJWT | 0.12.5 | JWT 签发/验证 |
| Lombok | 1.18.x | 简化代码 |
| H2 | 2.x | 测试数据库 |

---

**Plan complete.**