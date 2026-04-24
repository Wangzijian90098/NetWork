-- User table
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

-- API Key table
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Platform Key table (for proxy service)
CREATE TABLE IF NOT EXISTS platform_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_platform (platform)
);

-- Model Price table
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

-- Usage Log table
CREATE TABLE IF NOT EXISTS usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    api_key_id BIGINT,
    model_id VARCHAR(100),
    request_type VARCHAR(50),
    input_tokens INT,
    output_tokens INT,
    cost DECIMAL(10, 4),
    response_time_ms INT,
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

-- Index for usage logs
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
