"""IP 归属地探测工具

策略：优先使用本地 .db 文件查询（ip2region v1 格式，npm 包版）；
      降级调用 ip-api.com HTTP API（每天 45 次限额）。
"""
import os
import socket
import struct
import json
import urllib.request
from typing import Literal
from functools import lru_cache

Region = Literal["CN", "OVERSEAS"]

_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ip2region.xdb")

# ---- 本地 .db 文件解析（ip2region v1 格式） ----

_db_header = None  # (index_start, total) — 惰性加载
_db_fh = None


def _load_db_header():
    """加载 .db 头部：返回 (索引区起始offset, 索引条目总数)"""
    global _db_header
    if _db_header is not None:
        return _db_header
    if not os.path.exists(_DB_PATH):
        _db_header = (0, 0)
        return _db_header
    with open(_DB_PATH, "rb") as f:
        f.seek(0, 2)
        file_size = f.tell()
        f.seek(max(0, file_size - 8))
        tail = f.read(8)
        if len(tail) == 8:
            # v1 格式：最后8字节 = [索引起始offset(4B LE), 索引条目数(4B LE)]
            index_start, total = struct.unpack("<II", tail)
            _db_header = (index_start, total)
        else:
            _db_header = (0, 0)
    return _db_header


def _db_search(ip_str: str) -> str | None:
    """
    用二分查找在本地 .db 文件中查询 IP 归属地字符串。
    v1 格式：8字节索引项 (start_ip, end_ip, data_offset, data_len)
    返回类似 "中国|北京市|联通" 的字符串，失败返回 None。
    """
    index_start, total = _load_db_header()
    if not total or not os.path.exists(_DB_PATH):
        return None

    try:
        ip_num = _ip_to_num(socket.gethostbyname(ip_str))
    except socket.gaierror:
        return None

    with open(_DB_PATH, "rb") as fh:
        # 8字节索引项
        lo, hi = 0, total - 1
        result = None

        while lo <= hi:
            mid = (lo + hi) >> 1
            pos = index_start + mid * 8
            fh.seek(pos)
            buf = fh.read(8)
            if len(buf) < 8:
                break
            sip, eip, data_off, data_len = struct.unpack("<IIII", buf)

            if ip_num < sip:
                hi = mid - 1
            elif ip_num > eip:
                lo = mid + 1
            else:
                fh.seek(data_off)
                result = fh.read(data_len).decode("utf-8", errors="replace")
                break

        return result


# ---- HTTP API 降级（ip-api.com） ----

@lru_cache(maxsize=256)
def _http_query(ip: str) -> Region | None:
    """通过 HTTP API 查询 IP 归属地，缓存结果。"""
    try:
        url = f"http://ip-api.com/json/{ip}?fields=countryCode"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            code = data.get("countryCode", "")
            if code == "CN":
                return "CN"
            elif code and code != "?":
                return "OVERSEAS"
    except Exception:
        pass
    return None


# ---- 公共 API ----

def ip_to_region(ip: str) -> Region:
    """
    将 IP 地址转换为地区标识。
    中国大陆返回 'CN'，其余返回 'OVERSEAS'。
    无法判断时默认返回 'OVERSEAS'（安全默认值）。
    """
    # 1. 优先尝试本地 .db 文件
    region_str = _db_search(ip)
    if region_str and ("中国" in region_str or "CN" in region_str):
        return "CN"
    if region_str:
        return "OVERSEAS"

    # 2. 降级 HTTP API
    result = _http_query(ip)
    if result:
        return result

    # 3. 无法判断，默认海外（安全默认值）
    return "OVERSEAS"


def _ip_to_num(ip: str) -> int:
    """将点分十进制 IP 转为无符号整数"""
    parts = ip.split(".")
    return (int(parts[0]) << 24) | (int(parts[1]) << 16) | (int(parts[2]) << 8) | int(parts[3])


def get_client_ip(request) -> str:
    """
    从 Flask 请求中获取真实客户端 IP。
    优先取 X-Forwarded-For / X-Real-IP（反向代理场景），
    否则取 remote_addr。
    """
    forwarded = request.headers.get("X-Forwarded-For", "").split(",")
    if forwarded and forwarded[0].strip():
        return forwarded[0].strip()
    real_ip = request.headers.get("X-Real-IP", "")
    if real_ip:
        return real_ip.strip()
    return request.remote_addr or "127.0.0.1"
