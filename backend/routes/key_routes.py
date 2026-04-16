"""API Key 管理路由"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_token, extract_token_from_header

key_bp = Blueprint("keys", __name__, url_prefix="/api/keys")


def require_auth():
    """验证 JWT Token，返回 user_id"""
    token = extract_token_from_header(request.headers.get("Authorization"))
    if not token:
        return None, jsonify({"error": "Unauthorized"}), 401
    payload = verify_token(token)
    if not payload:
        return None, jsonify({"error": "Invalid token"}), 401
    return payload["user_id"], None, None


@key_bp.route("", methods=["GET"])
def list_keys():
    user_id, error, status = require_auth()
    if error:
        return error, status
    keys = __import__("services.key_service", fromlist=["get_keys_by_user"]).get_keys_by_user(user_id)
    return jsonify({"success": True, "data": keys}), 200


@key_bp.route("", methods=["POST"])
def create_key():
    user_id, error, status = require_auth()
    if error:
        return error, status
    data = request.get_json() or {}
    name = data.get("name", "My API Key")
    key = __import__("services.key_service", fromlist=["create_key"]).create_key(user_id, name)
    return jsonify({"success": True, "data": key}), 201


@key_bp.route("/<int:key_id>", methods=["DELETE"])
def revoke_key(key_id):
    user_id, error, status = require_auth()
    if error:
        return error, status
    ok = __import__("services.key_service", fromlist=["revoke_key"]).revoke_key(user_id, key_id)
    if ok:
        return jsonify({"success": True, "message": "Key 已撤销"}), 200
    return jsonify({"success": False, "message": "Key 不存在或已撤销"}), 404
