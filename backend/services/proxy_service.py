"""聊天代理服务：路由 + 上游转发 + 计费"""
import uuid
import requests
from datetime import datetime
from services import admin_service, key_service
from utils.ip_region import get_client_ip, ip_to_region

# 模型 → provider 映射
MODEL_PROVIDER_MAP = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "gpt-4-turbo": "openai",
    "gpt-4": "openai",
    "gpt-3.5-turbo": "openai",
    "claude-sonnet-4-6": "anthropic",
    "claude-sonnet-4-6": "anthropic",
    "claude-3-opus": "anthropic",
    "claude-3-sonnet": "anthropic",
    "deepseek-chat": "deepseek",
    "deepseek-coder": "deepseek",
    "gemini-1.5-pro": "google",
    "gemini-1.5-flash": "google",
    "gemini-pro": "google",
    "moonshot-v1-8k": "moonshot",
    "moonshot-v1-32k": "moonshot",
    "glm-4": "zhipu",
    "glm-4v": "zhipu",
    "qwen-plus": "alibaba",
    "qwen-turbo": "alibaba",
}

# provider → base_url 映射
PROVIDER_BASE_URL = {
    "openai": "https://api.openai.com/v1",
    "anthropic": "https://api.anthropic.com/v1",
    "deepseek": "https://api.deepseek.com/v1",
    "google": "https://generativelanguage.googleapis.com/v1beta",
    "moonshot": "https://api.moonshot.cn/v1",
    "zhipu": "https://open.bigmodel.cn/api/paas/v4",
    "alibaba": "https://dashscope.aliyuncs.com/compatible-mode/v1",
}


def get_provider(model: str) -> str | None:
    """从模型名推断 provider"""
    if model in MODEL_PROVIDER_MAP:
        return MODEL_PROVIDER_MAP[model]
    for prefix, provider in MODEL_PROVIDER_MAP.items():
        if model.startswith(prefix.rsplit("-", 1)[0]) or prefix.startswith(model.split("-")[0]):
            return provider
    return None


def select_platform_key(provider: str, region: str) -> dict | None:
    """从平台 Key 池中选择一个可用的 Key（按地区筛选）"""
    keys = admin_service.get_platform_keys_by_provider(provider, region)
    if not keys:
        return None
    return keys[0]


def estimate_cost(model: str, messages: list) -> float:
    """估算请求费用（用于余额预扣）"""
    price = admin_service.get_model_price(model)
    if not price:
        return 0.0
    estimated_tokens = len(messages) * 50
    return estimated_tokens / 1000 * (price["price_per_1k_input"] + price["price_per_1k_output"])


def deduct_balance(user_id: int, cost: float) -> bool:
    """扣减用户余额"""
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET balance = balance - ? WHERE id = ? AND balance >= ?",
                       (cost, user_id, cost))
        return cursor.rowcount > 0


def refund_balance(user_id: int, cost: float):
    """退还余额（代理失败时调用）"""
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("UPDATE user SET balance = balance + ? WHERE id = ?", (cost, user_id))


def record_usage(user_id: int, api_key_id: int, model: str,
                 input_tokens: int, output_tokens: int, cost: float, request_id: str):
    """记录用量日志"""
    from data.database import get_cursor
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO usage_log (user_id, api_key_id, model, input_tokens, output_tokens, cost, request_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, api_key_id, model, input_tokens, output_tokens, cost, request_id))


def proxy_chat_request(bearer_token: str, request_data: dict, flask_request=None) -> tuple[dict | None, int, str]:
    """
    核心代理方法。
    返回 (上游响应json, HTTP状态码, 错误消息)
    """
    model = request_data.get("model", "")
    messages = request_data.get("messages", [])

    # 1. 验证 Key
    key_info = key_service.validate_key(bearer_token)
    if not key_info:
        return None, 401, "Invalid API key"
    if key_info["status"] != "active":
        return None, 401, "API key is inactive"
    user_id = key_info["user_id"]
    api_key_id = key_info["id"]
    user_balance = key_info["balance"]

    # 2. 获取用户地区（未配置则自动探测并写入DB）
    user_region = key_info.get("region")
    if not user_region:
        client_ip = get_client_ip(flask_request) if flask_request else "127.0.0.1"
        user_region = ip_to_region(client_ip)
        from data.database import get_cursor
        with get_cursor() as cursor:
            cursor.execute(
                "UPDATE user SET region = ? WHERE id = ?",
                (user_region, user_id)
            )

    # 3. 获取模型价格
    price = admin_service.get_model_price(model)
    if not price:
        return None, 422, f"Model '{model}' not found or disabled"

    # 4. 估算费用并检查余额
    estimated_cost = estimate_cost(model, messages)
    if user_balance < estimated_cost:
        return None, 402, "Insufficient balance"

    # 5. 路由到 provider
    provider = get_provider(model)
    if not provider:
        return None, 422, f"Provider for model '{model}' not configured"

    platform_key = select_platform_key(provider, user_region)
    if not platform_key:
        return None, 503, "No available platform key for this provider"

    base_url = platform_key["base_url"] or PROVIDER_BASE_URL.get(provider, "")
    upstream_url = f"{base_url}/chat/completions"

    # 6. 构建上游请求头
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {platform_key['key_token']}"}
    if provider == "anthropic":
        headers["x-api-key"] = headers.pop("Authorization", "").replace("Bearer ", "")
        headers["anthropic-version"] = "2023-06-01"
        upstream_url = f"{base_url}/messages"
        upstream_data = {
            "model": model,
            "messages": messages,
            "max_tokens": request_data.get("max_tokens", 1024),
        }
        if "temperature" in request_data:
            upstream_data["temperature"] = request_data["temperature"]
    else:
        upstream_data = request_data

    # 7. 转发请求
    request_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
    try:
        resp = requests.post(upstream_url, json=upstream_data, headers=headers, timeout=60)
    except requests.exceptions.Timeout:
        return None, 504, "Upstream request timeout"
    except requests.exceptions.RequestException as e:
        return None, 502, f"Upstream request failed: {str(e)}"

    # 8. 解析上游响应
    if resp.status_code != 200:
        refund_balance(user_id, estimated_cost)
        return None, 502, f"Upstream error: {resp.text[:200]}"

    upstream_json = resp.json()

    # 9. 提取 usage 并计算实际费用
    usage = upstream_json.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    input_cost = input_tokens / 1000 * price["price_per_1k_input"]
    output_cost = output_tokens / 1000 * price["price_per_1k_output"]
    actual_cost = round(input_cost + output_cost, 6)

    # 10. 实际扣费
    if not deduct_balance(user_id, actual_cost):
        refund_balance(user_id, estimated_cost)
        return None, 402, "Balance deduction failed"

    # 11. 记录用量
    record_usage(user_id, api_key_id, model, input_tokens, output_tokens, actual_cost, request_id)

    # 12. 附加 request_id 并返回
    upstream_json["id"] = request_id
    return upstream_json, 200, ""
