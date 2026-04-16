"""认证服务"""
from data.database import get_cursor
from utils.hash_util import hash_password, verify_password
from utils.jwt_util import generate_token
from models.models import User


def register(email: str, password: str, region: str = None) -> tuple[bool, str]:
    """注册用户。返回 (成功, 消息)"""
    if not email or not password:
        return False, "邮箱和密码不能为空"
    if len(password) < 6:
        return False, "密码长度不能少于6位"
    with get_cursor() as cursor:
        cursor.execute("SELECT id FROM user WHERE email = ?", (email,))
        if cursor.fetchone():
            return False, "该邮箱已注册"
        hashed = hash_password(password)
        region_value = region if region in ("CN", "OVERSEAS") else None
        cursor.execute(
            "INSERT INTO user (email, password, balance, region) VALUES (?, ?, ?, ?)",
            (email, hashed, 10.0, region_value)
        )
    return True, "注册成功"


def login(email: str, password: str) -> tuple[bool, dict | None, str]:
    """登录。返回 (成功, 用户数据, JWT)"""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            return False, None, "邮箱或密码错误"
        if not verify_password(password, row["password"]):
            return False, None, "邮箱或密码错误"
        token = generate_token(row["id"], row["email"], row["role"])
        user = {
            "id": row["id"],
            "email": row["email"],
            "balance": row["balance"],
            "role": row["role"],
        }
        return True, {"token": token, "user": user}, ""
