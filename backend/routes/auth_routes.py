"""认证路由"""
from flask import Blueprint, request, jsonify, make_response

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
        token = user_data["token"]
        user_info = user_data["user"]
        response = make_response(jsonify({
            "success": True,
            "data": {"user": user_info}
        }))
        response.set_cookie(
            "token",
            token,
            httponly=True,
            samesite="Lax",
            path="/",
            max_age=7 * 24 * 3600
        )
        return response
    return jsonify({"success": False, "message": error}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"success": True, "message": "已退出登录"}))
    response.delete_cookie("token", path="/")
    return response
