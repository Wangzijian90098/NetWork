"""数据模型类"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: int
    email: str
    password: str  # BCrypt 哈希
    balance: float  # 美元
    role: str  # 'user' | 'admin'
    created_at: datetime
    updated_at: datetime


@dataclass
class ApiKey:
    id: int
    user_id: int
    key_name: str
    token: str  # sk-aihub-xxx
    status: str  # 'active' | 'revoked'
    created_at: datetime


@dataclass
class PlatformKey:
    id: int
    provider: str  # 'openai' | 'anthropic' | 'deepseek' | ...
    key_token: str
    base_url: str
    status: str  # 'active' | 'exhausted' | 'revoked'
    created_at: datetime


@dataclass
class ModelPrice:
    id: int
    model: str  # 'gpt-4o' | 'claude-sonnet-4-6' | ...
    provider: str
    price_per_1k_input: float  # 美元
    price_per_1k_output: float  # 美元
    enabled: bool


@dataclass
class UsageLog:
    id: int
    user_id: int
    api_key_id: int
    model: str
    input_tokens: int
    output_tokens: int
    cost: float  # 美元
    request_time: datetime
    request_id: str
