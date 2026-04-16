"""用量查询服务"""
from data.database import get_cursor
from datetime import datetime, timedelta


def get_usage_by_user(user_id: int, days: int = 30) -> dict:
    """获取用户用量统计"""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) as total_requests,
                   COALESCE(SUM(input_tokens), 0) as total_input_tokens,
                   COALESCE(SUM(output_tokens), 0) as total_output_tokens,
                   COALESCE(SUM(cost), 0) as total_cost
            FROM usage_log
            WHERE user_id = ? AND request_time >= ?
        """, (user_id, since))
        row = cursor.fetchone()
        return dict(row)


def get_usage_by_model(user_id: int, days: int = 30) -> list[dict]:
    """按模型分组统计用量"""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT model,
                   COUNT(*) as requests,
                   COALESCE(SUM(input_tokens), 0) as input_tokens,
                   COALESCE(SUM(output_tokens), 0) as output_tokens,
                   COALESCE(SUM(cost), 0) as cost
            FROM usage_log
            WHERE user_id = ? AND request_time >= ?
            GROUP BY model
            ORDER BY cost DESC
        """, (user_id, since))
        return [dict(row) for row in cursor.fetchall()]
