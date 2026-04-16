"""用户账户设置路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_token

user_bp = Blueprint("user", __name__, url_prefix="/api/user")


def _get_user_from_token():
    """从请求头提取并验证用户。返回 (payload, error_resp, status)"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, jsonify({"success": False, "message": "Unauthorized"}), 401
    token = auth_header[7:]
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"success": False, "message": "Invalid token"}), 401
    return payload, None, None


@user_bp.route("/me", methods=["GET"])
def get_profile():
    """获取当前用户信息（含 region）"""
    payload, error_resp, status = _get_user_from_token()
    if error_resp:
        return error_resp, status
    user_id = payload["user_id"]
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id, email, balance, role, region, created_at FROM user WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "User not found"}), 404
        return jsonify({"success": True, "data": dict(row)}), 200


@user_bp.route("/region", methods=["PUT"])
def update_region():
    """更新用户地区"""
    payload, error_resp, status = _get_user_from_token()
    if error_resp:
        return error_resp, status
    data = request.get_json() or {}
    region = data.get("region", "")
    if region not in ("CN", "OVERSEAS"):
        return jsonify({"success": False, "message": "Invalid region value"}), 400
    user_id = payload["user_id"]
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET region = ? WHERE id = ?", (region, user_id))
    return jsonify({"success": True, "message": "Region updated"}), 200
