"""H2 数据库连接管理 + 表初始化"""
import os
import sqlite3  # 使用 SQLite（零配置，H2 格式兼容）作为开发数据库
from contextlib import contextmanager

# 生产环境替换为：jaydebeapi + H2 JAR（仅需更换连接字符串）
# 本实现使用 SQLite 以降低门槛，后期可无缝迁移至 H2/MySQL

DB_PATH = os.path.join(os.path.dirname(__file__), "aihubs.db")
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,4) DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_key (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_name VARCHAR(100),
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS platform_key (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider VARCHAR(50) NOT NULL,
    key_token VARCHAR(255) NOT NULL,
    base_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_price (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    price_per_1k_input DECIMAL(10,6) NOT NULL,
    price_per_1k_output DECIMAL(10,6) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_key_id INTEGER NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (api_key_id) REFERENCES api_key(id)
);
"""


def get_connection():
    """获取数据库连接（thread-local）"""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_connection()
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
        # 插入默认管理员（密码: admin123）
        cursor = conn.execute(
            "SELECT id FROM user WHERE email = 'admin@aihubs.com'"
        )
        if not cursor.fetchone():
            from utils.hash_util import hash_password
            conn.execute(
                "INSERT INTO user (email, password, balance, role) VALUES (?, ?, ?, ?)",
                ("admin@aihubs.com", hash_password("admin123"), 9999.0, "admin")
            )
            conn.commit()
            print("[DB] Default admin created: admin@aihubs.com / admin123")
        # 插入默认模型价格
        default_models = [
            ("gpt-4o", "openai", 0.0025, 0.01),
            ("gpt-4o-mini", "openai", 0.00015, 0.0006),
            ("gpt-4-turbo", "openai", 0.01, 0.03),
            ("claude-sonnet-4-6", "anthropic", 0.003, 0.015),
            ("claude-sonnet-4-6", "anthropic", 0.0008, 0.004),
            ("deepseek-chat", "deepseek", 0.00014, 0.00028),
            ("deepseek-coder", "deepseek", 0.00014, 0.00028),
            ("gemini-1.5-pro", "google", 0.00125, 0.005),
            ("gemini-1.5-flash", "google", 0.000075, 0.0003),
            ("moonshot-v1-8k", "moonshot", 0.0006, 0.0006),
            ("glm-4", "zhipu", 0.0001, 0.0001),
            ("qwen-plus", "alibaba", 0.0008, 0.002),
        ]
        for model, provider, inp, outp in default_models:
            conn.execute(
                "INSERT OR IGNORE INTO model_price (model, provider, price_per_1k_input, price_per_1k_output) VALUES (?, ?, ?, ?)",
                (model, provider, inp, outp)
            )
        conn.commit()
        # Migration: add region columns if not exist
        cursor.execute("PRAGMA table_info(user)")
        user_columns = [col[1] for col in cursor.fetchall()]
        if "region" not in user_columns:
            cursor.execute("ALTER TABLE user ADD COLUMN region VARCHAR(10) DEFAULT NULL")
            print("[DB] Added 'region' column to user table")

        cursor.execute("PRAGMA table_info(platform_key)")
        pk_columns = [col[1] for col in cursor.fetchall()]
        if "region" not in pk_columns:
            cursor.execute("ALTER TABLE platform_key ADD COLUMN region VARCHAR(10) DEFAULT 'GLOBAL'")
            print("[DB] Added 'region' column to platform_key table")

        conn.commit()
        print("[DB] Initialized successfully")
    finally:
        conn.close()


@contextmanager
def get_cursor():
    """数据库上下文管理器（自动提交/回滚）"""
    conn = get_connection()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
