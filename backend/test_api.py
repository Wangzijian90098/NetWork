#!/usr/bin/env python3
"""API 端到端测试（pytest）"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from ai_hub_backend import app, register_blueprints
from data.database import init_db


@pytest.fixture
def client():
    """Flask 测试客户端"""
    app.config["TESTING"] = True
    with app.test_client() as client:
        with app.app_context():
            init_db()
            # __main__ 块不会在 pytest 中执行，需要手动注册蓝图
            if not hasattr(app, '_blueprints_registered'):
                register_blueprints()
                app._blueprints_registered = True
        yield client


@pytest.fixture
def jwt_token(client):
    """注册并获取 JWT Token"""
    email = "jwt_user@example.com"
    rv = client.post("/api/auth/register", json={
        "email": email,
        "password": "test123456"
    })
    if rv.status_code == 400:
        # 已被注册，直接登录
        pass
    else:
        assert rv.status_code == 200, rv.get_json()
    rv = client.post("/api/auth/login", json={
        "email": email,
        "password": "test123456"
    })
    assert rv.status_code == 200
    data = rv.get_json()
    return data["data"]["token"]


@pytest.fixture
def api_key_token(client, jwt_token):
    """注册用户并创建 API Key，返回 sk-aihub-... token"""
    headers = {"Authorization": f"Bearer {jwt_token}"}
    rv = client.post("/api/keys", json={"name": "Test Key"}, headers=headers)
    assert rv.status_code == 201, rv.get_json()
    return rv.get_json()["data"]["token"]


def test_health(client):
    """健康检查"""
    rv = client.get("/health")
    assert rv.status_code == 200
    assert rv.get_json()["status"] == "ok"


def test_register(client):
    """注册接口"""
    import time
    unique = str(int(time.time() * 1000))
    rv = client.post("/api/auth/register", json={
        "email": f"newuser_{unique}@example.com",
        "password": "password123"
    })
    assert rv.status_code == 200
    assert rv.get_json()["success"] is True


def test_register_duplicate(client):
    """重复注册"""
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "password1"})
    rv = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "password1"})
    assert rv.status_code == 400


def test_login(client):
    """登录接口"""
    client.post("/api/auth/register", json={"email": "login@example.com", "password": "password1"})
    rv = client.post("/api/auth/login", json={"email": "login@example.com", "password": "password1"})
    assert rv.status_code == 200
    data = rv.get_json()
    assert "token" in data["data"]


def test_create_and_list_keys(client, jwt_token):
    """创建和列举 Key"""
    headers = {"Authorization": f"Bearer {jwt_token}"}
    rv = client.post("/api/keys", json={"name": "Test Key"}, headers=headers)
    assert rv.status_code == 201
    key_data = rv.get_json()["data"]
    assert key_data["token"].startswith("sk-aihub-")

    rv = client.get("/api/keys", headers=headers)
    assert rv.status_code == 200
    assert len(rv.get_json()["data"]) >= 1


def test_list_models(client):
    """模型列表"""
    rv = client.get("/v1/models")
    assert rv.status_code == 200
    data = rv.get_json()
    assert data["object"] == "list"
    model_ids = [m["id"] for m in data["data"]]
    assert "gpt-4o" in model_ids


def test_proxy_without_key(client):
    """无 Key 访问代理应返回 401"""
    rv = client.post("/v1/chat/completions", json={
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "hi"}]
    })
    assert rv.status_code == 401


def test_proxy_insufficient_balance(client, api_key_token):
    """余额不足应返回 402（无可用平台 Key 时返回 503）"""
    headers = {"Authorization": f"Bearer {api_key_token}"}
    rv = client.post("/v1/chat/completions",
                     headers=headers,
                     json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]})
    assert rv.status_code in [402, 503]
