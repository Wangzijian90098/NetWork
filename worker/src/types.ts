// ---- 用户相关 ----
export interface User {
  id: number;
  email: string;
  password: string;
  balance: number;
  role: string;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: number;
  email: string;
  balance: number;
  role: string;
  region: string | null;
}

// ---- API Key ----
export interface ApiKey {
  id: number;
  user_id: number;
  key_name: string;
  token: string;
  status: string;
  created_at: string;
}

// ---- 平台 Key ----
export interface PlatformKey {
  id: number;
  provider: string;
  key_token: string;
  base_url: string | null;
  region: string;
  status: string;
}

// ---- 模型价格 ----
export interface ModelPrice {
  id: number;
  model: string;
  provider: string;
  price_per_1k_input: number;
  price_per_1k_output: number;
  enabled: number;
}

// ---- 用量日志 ----
export interface UsageLog {
  id: number;
  user_id: number;
  api_key_id: number;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  request_time: string;
  request_id: string;
}

// ---- 地区 ----
export type Region = 'CN' | 'OVERSEAS';

// ---- 路由上下文 ----
export interface AuthVariables {
  user?: SafeUser;
}
