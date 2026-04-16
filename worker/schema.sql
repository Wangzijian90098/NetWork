CREATE TABLE IF NOT EXISTS user (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    balance    REAL    DEFAULT 0,
    role       TEXT    DEFAULT 'user',
    region     TEXT,
    created_at TEXT    DEFAULT (datetime('now')),
    updated_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_key (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    key_name  TEXT,
    token     TEXT    UNIQUE NOT NULL,
    status    TEXT    DEFAULT 'active',
    created_at TEXT   DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS platform_key (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    provider  TEXT    NOT NULL,
    key_token TEXT    NOT NULL,
    base_url  TEXT,
    region    TEXT    DEFAULT 'GLOBAL',
    status    TEXT    DEFAULT 'active',
    created_at TEXT   DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS model_price (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    model               TEXT    UNIQUE NOT NULL,
    provider            TEXT    NOT NULL,
    price_per_1k_input  REAL    NOT NULL,
    price_per_1k_output REAL    NOT NULL,
    enabled             INTEGER  DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usage_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    api_key_id   INTEGER NOT NULL,
    model        TEXT    NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost         REAL    DEFAULT 0,
    request_time TEXT    DEFAULT (datetime('now')),
    request_id   TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (api_key_id) REFERENCES api_key(id)
);
