"""用量查询路由"""
from flask import Blueprint, jsonify, request
from utils.jwt_util import verify_token

usage_bp = Blueprint("usage", __name__, url_prefix="/v1")


def get_token(req):
    """优先从 Cookie 读取 Token，fallback 到 Authorization Header"""
    token = req.cookies.get("token")
    if token:
        return token
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def require_auth():
    token = get_token(request)
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    return payload["user_id"], None, None


@usage_bp.route("/account/usage", methods=["GET"])
def account_usage():
    """获取当前用户用量统计（OpenAI 兼容路径）"""
    user_id, err, status = require_auth()
    if err:
        return err, status
    days = int(request.args.get("days", 30))
    summary = __import__("services.usage_service", fromlist=["get_usage_by_user"]).get_usage_by_user(user_id, days)
    by_model = __import__("services.usage_service", fromlist=["get_usage_by_model"]).get_usage_by_model(user_id, days)
    return jsonify({
        "success": True,
        "data": {
            "period": f"last_{days}_days",
            "summary": summary,
            "by_model": by_model,
        }
    }), 200
