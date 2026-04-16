"""密码哈希工具（BCrypt）"""
from passlib.hash import bcrypt


def hash_password(password: str) -> str:
    """哈希密码"""
    return bcrypt.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    return bcrypt.verify(password, hashed)
