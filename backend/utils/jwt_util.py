"""JWT Token 签发与验证"""
import jwt
import datetime

SECRET_KEY = "aihubs-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def generate_token(user_id: int, email: str, role: str) -> str:
    """签发 JWT Token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRE_DAYS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    """验证 JWT Token，返回 payload 或 None"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def extract_token_from_header(auth_header: str | None) -> str | None:
    """从 Authorization: Bearer <token> 提取 Token"""
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]
