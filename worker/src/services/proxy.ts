import type { D1Database } from '@cloudflare/workers-types';
import type { PlatformKey, ModelPrice } from '../types';

export const PROVIDER_MAP: Record<string, string> = {
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-4': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-sonnet-4-6': 'anthropic',
  'claude-3-opus': 'anthropic',
  'claude-3-sonnet': 'anthropic',
  'deepseek-chat': 'deepseek',
  'deepseek-coder': 'deepseek',
  'gemini-1.5-pro': 'google',
  'gemini-1.5-flash': 'google',
  'gemini-pro': 'google',
  'moonshot-v1-8k': 'moonshot',
  'moonshot-v1-32k': 'moonshot',
  'glm-4': 'zhipu',
  'glm-4v': 'zhipu',
  'qwen-plus': 'alibaba',
  'qwen-turbo': 'alibaba',
};

export const PROVIDER_BASE_URL: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  moonshot: 'https://api.moonshot.cn/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

export function getProvider(model: string): string | null {
  return PROVIDER_MAP[model] ?? null;
}

export async function selectPlatformKey(
  db: D1Database,
  provider: string,
  region: string
): Promise<PlatformKey | null> {
  const exact = await db
    .prepare('SELECT * FROM platform_key WHERE provider = ? AND region = ? AND status = ? LIMIT 1')
    .bind(provider, region, 'active')
    .first<PlatformKey>();
  if (exact) return exact;
  return db
    .prepare('SELECT * FROM platform_key WHERE provider = ? AND region = ? AND status = ? LIMIT 1')
    .bind(provider, 'GLOBAL', 'active')
    .first<PlatformKey>();
}

export async function getModelPrice(db: D1Database, model: string): Promise<ModelPrice | null> {
  return db
    .prepare('SELECT * FROM model_price WHERE model = ? AND enabled = 1 LIMIT 1')
    .first<ModelPrice>();
}

export async function deductBalance(db: D1Database, userId: number, cost: number): Promise<boolean> {
  const result = await db
    .prepare('UPDATE user SET balance = balance - ? WHERE id = ? AND balance >= ?')
    .bind(cost, userId, cost)
    .run();
  return (result.meta as { changes?: number }).changes > 0;
}

export async function refundBalance(db: D1Database, userId: number, cost: number): Promise<void> {
  await db
    .prepare('UPDATE user SET balance = balance + ? WHERE id = ?')
    .bind(cost, userId)
    .run();
}

export async function recordUsage(
  db: D1Database,
  userId: number,
  apiKeyId: number,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  requestId: string
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO usage_log (user_id, api_key_id, model, input_tokens, output_tokens, cost, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(userId, apiKeyId, model, inputTokens, outputTokens, cost, requestId)
    .run();
}
