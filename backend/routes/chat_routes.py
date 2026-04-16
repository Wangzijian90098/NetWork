"""聊天代理路由（OpenAI 兼容）"""
from flask import Blueprint, request, jsonify
from utils.jwt_util import extract_token_from_header, verify_token
from services import proxy_service

chat_bp = Blueprint("chat", __name__, url_prefix="/v1")


@chat_bp.route("/chat/completions", methods=["POST"])
def chat_completions():
    """OpenAI 兼容的聊天补全接口"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": {"message": "Missing or invalid Authorization header", "type": "invalid_request_error"}}), 401
    bearer_token = auth_header[7:]

    if not request.is_json:
        return jsonify({"error": {"message": "Request body must be JSON", "type": "invalid_request_error"}}), 400

    request_data = request.get_json()
    result, status_code, error = proxy_service.proxy_chat_request(bearer_token, request_data)

    if error:
        return jsonify({"error": {"message": error, "type": "invalid_request_error"}}), status_code

    return jsonify(result), 200


@chat_bp.route("/models", methods=["GET"])
def list_models():
    """返回可用模型列表"""
    from services import admin_service
    prices = admin_service.get_model_prices()
    data = [
        {
            "id": p["model"],
            "object": "model",
            "owned_by": p["provider"],
            "permission": [],
            "root": p["model"],
        }
        for p in prices if p.get("enabled", True)
    ]
    return jsonify({"object": "list", "data": data}), 200
