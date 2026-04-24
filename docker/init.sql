-- NetWork AI 初始化数据库脚本
-- 此文件会在 MySQL 容器首次启动时自动执行

-- 创建数据库（如未在 docker-compose 中创建）
CREATE DATABASE IF NOT EXISTS aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE aihub;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    balance DECIMAL(12, 4) DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    region VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- API Key 表
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 平台 Key 表（用于代理服务）
CREATE TABLE IF NOT EXISTS platform_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255),
    region VARCHAR(20) DEFAULT 'GLOBAL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_platform_region (platform, region)
);

-- 模型价格表
CREATE TABLE IF NOT EXISTS model_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL UNIQUE,
    model_name VARCHAR(200),
    input_price DECIMAL(10, 6) NOT NULL,
    output_price DECIMAL(10, 6) NOT NULL,
    unit VARCHAR(20) DEFAULT '1M',
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 使用日志表
CREATE TABLE IF NOT EXISTS usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    api_key_id BIGINT,
    model_id VARCHAR(100),
    request_type VARCHAR(50),
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost DECIMAL(10, 4) DEFAULT 0,
    response_time_ms INT DEFAULT 0,
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);

-- 插入默认管理员（密码: admin123）
INSERT IGNORE INTO users (username, password, email, enabled, balance, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye0U8qP0J0q1q1q1q1q1q1q1q1q1q1q1', 'admin@aihubs.com', TRUE, 9999.0000, 'admin');

-- 插入默认模型价格
INSERT IGNORE INTO model_prices (model_id, model_name, input_price, output_price) VALUES
('gpt-4o', 'GPT-4o', 0.0025, 0.01),
('gpt-4o-mini', 'GPT-4o Mini', 0.00015, 0.0006),
('gpt-4-turbo', 'GPT-4 Turbo', 0.01, 0.03),
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.0005, 0.0015),
('claude-opus-4-7', 'Claude Opus 4', 0.003, 0.015),
('claude-sonnet-4-7', 'Claude Opus 4', 0.0015, 0.008),
('deepseek-chat', 'DeepSeek Chat', 0.00014, 0.00028),
('deepseek-coder', 'DeepSeek Coder', 0.00014, 0.00028),
('gemini-1.5-pro', 'Gemini 1.5 Pro', 0.00125, 0.005),
('gemini-1.5-flash', 'Gemini 1.5 Flash', 0.000075, 0.0003),
('moonshot-v1-8k', 'Moonshot V1 8K', 0.0006, 0.0006),
('glm-4', 'GLM-4', 0.0001, 0.0001),
('qwen-plus', 'Qwen Plus', 0.0008, 0.002);
