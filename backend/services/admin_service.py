"""管理员服务：用户管理 / 平台 Key 管理 / 模型单价管理"""
from data.database import get_cursor


# ---- 用户管理 ----

def get_users() -> list[dict]:
    """获取所有用户列表"""
    with get_cursor() as cursor:
        cursor.execute("SELECT id, email, balance, role, created_at, updated_at FROM user ORDER BY id")
        return [dict(row) for row in cursor.fetchall()]


def recharge_user(user_id: int, amount: float) -> bool:
    """给用户充值"""
    if amount <= 0:
        return False
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET balance = balance + ? WHERE id = ?", (amount, user_id))
        return cursor.rowcount > 0


def delete_user(user_id: int) -> bool:
    """删除用户（仅 admin 可操作）"""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM user WHERE id = ?", (user_id,))
        return cursor.rowcount > 0


# ---- 平台 Key 管理 ----

def get_platform_keys() -> list[dict]:
    """获取平台上游 Key 列表"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM platform_key ORDER BY id")
        return [dict(row) for row in cursor.fetchall()]


def add_platform_key(provider: str, key_token: str, base_url: str) -> dict:
    """添加平台上游 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO platform_key (provider, key_token, base_url) VALUES (?, ?, ?)",
            (provider, key_token, base_url)
        )
        key_id = cursor.lastrowid
        cursor.execute("SELECT * FROM platform_key WHERE id = ?", (key_id,))
        return dict(cursor.fetchone())


def delete_platform_key(key_id: int) -> bool:
    """删除平台 Key"""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM platform_key WHERE id = ?", (key_id,))
        return cursor.rowcount > 0


def get_platform_keys_by_provider(provider: str) -> list[dict]:
    """获取指定 provider 的可用 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM platform_key WHERE provider = ? AND status = 'active'",
            (provider,)
        )
        return [dict(row) for row in cursor.fetchall()]


# ---- 模型单价管理 ----

def get_model_prices() -> list[dict]:
    """获取所有模型单价"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM model_price ORDER BY provider, model")
        return [dict(row) for row in cursor.fetchall()]


def upsert_model_price(model: str, provider: str, price_in: float, price_out: float) -> dict:
    """添加或更新模型单价"""
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO model_price (model, provider, price_per_1k_input, price_per_1k_output)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(model) DO UPDATE SET
                provider = excluded.provider,
                price_per_1k_input = excluded.price_per_1k_input,
                price_per_1k_output = excluded.price_per_1k_output
        """, (model, provider, price_in, price_out))
        cursor.execute("SELECT * FROM model_price WHERE model = ?", (model,))
        return dict(cursor.fetchone())


def get_model_price(model: str) -> dict | None:
    """获取指定模型单价"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM model_price WHERE model = ? AND enabled = 1", (model,))
        row = cursor.fetchone()
        return dict(row) if row else None
