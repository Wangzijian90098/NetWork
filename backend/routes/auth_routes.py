"""认证路由"""
from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    success, message = __import__("services.auth_service", fromlist=["register"]).register(email, password)
    return jsonify({"success": success, "message": message}), 200 if success else 400


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    success, user_data, error = __import__("services.auth_service", fromlist=["login"]).login(email, password)
    if success:
        return jsonify({"success": True, "data": user_data}), 200
    return jsonify({"success": False, "message": error}), 401
