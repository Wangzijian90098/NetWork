"""用户 API Key 管理服务"""
import secrets
from data.database import get_cursor


def generate_key_token() -> str:
    """生成唯一的 Key Token"""
    return f"sk-aihub-{secrets.token_hex(16)}"


def create_key(user_id: int, name: str) -> dict | None:
    """为用户创建新的 API Key"""
    token = generate_key_token()
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO api_key (user_id, key_name, token) VALUES (?, ?, ?)",
            (user_id, name, token)
        )
        key_id = cursor.lastrowid
        cursor.execute("SELECT * FROM api_key WHERE id = ?", (key_id,))
        row = cursor.fetchone()
        return {
            "id": row["id"],
            "name": row["key_name"],
            "token": row["token"],
            "status": row["status"],
            "created_at": row["created_at"],
        }


def get_keys_by_user(user_id: int) -> list[dict]:
    """获取用户所有 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id, user_id, key_name, token, status, created_at FROM api_key WHERE user_id = ?",
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]


def revoke_key(user_id: int, key_id: int) -> bool:
    """撤销用户的 Key"""
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE api_key SET status = 'revoked' WHERE id = ? AND user_id = ? AND status = 'active'",
            (key_id, user_id)
        )
        return cursor.rowcount > 0


def validate_key(token: str) -> dict | None:
    """验证 Key 并返回关联用户信息。返回 None 表示无效"""
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT ak.id, ak.user_id, ak.status, u.balance, u.role
            FROM api_key ak
            JOIN user u ON u.id = ak.user_id
            WHERE ak.token = ?
        """, (token,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "status": row["status"],
            "balance": row["balance"],
            "role": row["role"],
            "region": row["region"] if "region" in row else None,
        }
