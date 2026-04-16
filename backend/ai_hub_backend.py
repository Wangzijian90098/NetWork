#!/usr/bin/env python3
"""AI API 中转平台 — 后端网关主入口"""
from flask import Flask, jsonify, send_from_directory
import os
from data.database import init_db

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False


@app.route("/")
def serve_root():
    """开发环境：Flask 直接托管前端入口"""
    return send_from_directory(os.path.dirname(__file__), "landing.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """开发环境：Flask 托管前端静态资源（HTML/CSS/JS）"""
    # 防止目录遍历
    filename = os.path.basename(filename)
    return send_from_directory(os.path.dirname(__file__), filename)


def register_blueprints():
    """注册所有蓝图"""
    from routes.auth_routes import auth_bp
    from routes.key_routes import key_bp
    from routes.chat_routes import chat_bp
    from routes.admin_routes import admin_bp
    from routes.usage_routes import usage_bp
    from routes.user_routes import user_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(key_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(usage_bp)


@app.route("/health", methods=["GET"])
def health():
    """健康检查"""
    return jsonify({"status": "ok", "service": "aihubs-backend"}), 200


@app.after_request
def add_cors(response):
    """允许跨域（开发环境）"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Registering blueprints...")
    register_blueprints()
    print("Starting server on http://localhost:8080")
    print("Default admin: admin@aihubs.com / admin123")
    app.run(host="0.0.0.0", port=8080, debug=True)
