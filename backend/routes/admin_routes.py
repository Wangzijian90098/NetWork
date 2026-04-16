"""管理员路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_token, extract_token_from_header

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def require_admin():
    """验证管理员权限"""
    token = extract_token_from_header(request.headers.get("Authorization"))
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    if payload.get("role") != "admin":
        return None, jsonify({"error": "Forbidden"}), 403
    return True, None, None


# ---- 用户管理 ----

@admin_bp.route("/users", methods=["GET"])
def list_users():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    users = __import__("services.admin_service", fromlist=["get_users"]).get_users()
    return jsonify({"success": True, "data": users}), 200


@admin_bp.route("/users/<int:user_id>/recharge", methods=["POST"])
def recharge(user_id):
    ok, err, status = require_admin()
    if not ok:
        return err, status
    data = request.get_json() or {}
    amount = float(data.get("amount", 0))
    ok2 = __import__("services.admin_service", fromlist=["recharge_user"]).recharge_user(user_id, amount)
    return jsonify({"success": ok2, "message": "充值成功" if ok2 else "充值失败"}), 200 if ok2 else 400


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    ok, err, status = require_admin()
    if not ok:
        return err, status
    ok2 = __import__("services.admin_service", fromlist=["delete_user"]).delete_user(user_id)
    return jsonify({"success": ok2}), 200 if ok2 else 404


# ---- 平台 Key 管理 ----

@admin_bp.route("/platform-keys", methods=["GET"])
def list_platform_keys():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    keys = __import__("services.admin_service", fromlist=["get_platform_keys"]).get_platform_keys()
    return jsonify({"success": True, "data": keys}), 200


@admin_bp.route("/platform-keys", methods=["POST"])
def add_platform_key():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    data = request.get_json() or {}
    key = __import__("services.admin_service", fromlist=["add_platform_key"]).add_platform_key(
        data.get("provider", ""), data.get("key_token", ""), data.get("base_url", "")
    )
    return jsonify({"success": True, "data": key}), 201


@admin_bp.route("/platform-keys/<int:key_id>", methods=["DELETE"])
def delete_platform_key(key_id):
    ok, err, status = require_admin()
    if not ok:
        return err, status
    ok2 = __import__("services.admin_service", fromlist=["delete_platform_key"]).delete_platform_key(key_id)
    return jsonify({"success": ok2}), 200 if ok2 else 404


# ---- 模型单价管理 ----

@admin_bp.route("/model-prices", methods=["GET"])
def list_model_prices():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    prices = __import__("services.admin_service", fromlist=["get_model_prices"]).get_model_prices()
    return jsonify({"success": True, "data": prices}), 200


@admin_bp.route("/model-prices", methods=["POST"])
def upsert_model_price():
    ok, err, status = require_admin()
    if not ok:
        return err, status
    data = request.get_json() or {}
    price = __import__("services.admin_service", fromlist=["upsert_model_price"]).upsert_model_price(
        data.get("model", ""), data.get("provider", ""),
        float(data.get("price_per_1k_input", 0)), float(data.get("price_per_1k_output", 0))
    )
    return jsonify({"success": True, "data": price}), 201
