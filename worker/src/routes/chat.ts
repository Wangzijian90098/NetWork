import { Hono } from 'hono';
import { queryOne } from '../db/index';
import type { Env } from '../db/index';
import { getClientIP, ipToRegion } from '../services/region';
import {
  getProvider,
  PROVIDER_BASE_URL,
  selectPlatformKey,
  getModelPrice,
  deductBalance,
  refundBalance,
  recordUsage,
} from '../services/proxy';

const chat = new Hono<{ Bindings: Env }>();

chat.post('/v1/chat/completions', async (c) => {
  // 1. 验证 API Key
  const authHeader = c.req.header('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Missing Authorization header', type: 'invalid_request_error' } }, 401);
  }
  const bearerToken = authHeader.slice(7);

  const keyInfo = await queryOne<{
    id: number;
    user_id: number;
    status: string;
    balance: number;
    region: string | null;
  }>(
    c.env.DB,
    `SELECT ak.id, ak.user_id, ak.status, u.balance, u.region
     FROM api_key ak JOIN user u ON u.id = ak.user_id WHERE ak.token = ?`,
    bearerToken
  );

  if (!keyInfo) return c.json({ error: { message: 'Invalid API key', type: 'invalid_request_error' } }, 401);
  if (keyInfo.status !== 'active') return c.json({ error: { message: 'API key inactive', type: 'invalid_request_error' } }, 401);

  const userId = keyInfo.user_id;
  const apiKeyId = keyInfo.id;
  const userBalance = keyInfo.balance;

  // 2. 获取/探测用户地区
  let userRegion: 'CN' | 'OVERSEAS' | null = keyInfo.region as 'CN' | 'OVERSEAS' | null;
  if (!userRegion) {
    const clientIP = getClientIP(c.req.raw);
    userRegion = await ipToRegion(clientIP);
    await c.env.DB
      .prepare('UPDATE user SET region = ? WHERE id = ? AND region IS NULL')
      .bind(userRegion, userId)
      .run();
  }

  // 3. 解析请求
  const body = await c.req.json<{
    model?: string;
    messages?: unknown[];
    max_tokens?: number;
    temperature?: number;
  }>();
  const model = body.model ?? '';
  const messages = body.messages ?? [];

  // 4. 验证模型
  const price = await getModelPrice(c.env.DB, model);
  if (!price) return c.json({ error: { message: `Model '${model}' not found`, type: 'invalid_request_error' } }, 422);

  // 5. 估算费用
  const estimatedTokens = messages.length * 50;
  const estimatedCost = (estimatedTokens / 1000) * (price.price_per_1k_input + price.price_per_1k_output);
  if (userBalance < estimatedCost) {
    return c.json({ error: { message: 'Insufficient balance', type: 'invalid_request_error' } }, 402);
  }

  // 6. 路由到 provider
  const provider = getProvider(model);
  if (!provider) return c.json({ error: { message: 'Provider not configured', type: 'invalid_request_error' } }, 422);

  const platformKey = await selectPlatformKey(c.env.DB, provider, userRegion!);
  if (!platformKey) {
    return c.json({ error: { message: 'No available platform key for this region', type: 'invalid_request_error' } }, 503);
  }

  const baseUrl = platformKey.base_url || PROVIDER_BASE_URL[provider];
  const upstreamUrl = provider === 'anthropic'
    ? `${baseUrl}/messages`
    : `${baseUrl}/chat/completions`;

  // 7. 构建上游请求头
  const upstreamHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'anthropic') {
    upstreamHeaders['x-api-key'] = platformKey.key_token;
    upstreamHeaders['anthropic-version'] = '2023-06-01';
  } else {
    upstreamHeaders['Authorization'] = `Bearer ${platformKey.key_token}`;
  }

  const upstreamBody: Record<string, unknown> = provider === 'anthropic'
    ? { model, messages, max_tokens: body.max_tokens ?? 1024, ...(body.temperature !== undefined ? { temperature: body.temperature } : {}) }
    : body;

  // 8. 转发请求
  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamBody),
      // @ts-ignore Cloudflare Workers 支持 cf.timeout
      cf: { timeout: 60 },
    } as RequestInit);
  } catch {
    return c.json({ error: { message: 'Upstream request timeout', type: 'invalid_request_error' } }, 504);
  }

  if (!upstreamResp.ok) {
    const text = await upstreamResp.text();
    await refundBalance(c.env.DB, userId, estimatedCost);
    return c.json({ error: { message: `Upstream error: ${text.slice(0, 200)}`, type: 'invalid_request_error' } }, 502);
  }

  // 9. 解析用量并扣费
  const upstreamJson = await upstreamResp.json<{
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    id?: string;
  }>();
  const usage = upstreamJson?.usage ?? {};
  const inputTokens = usage.prompt_tokens ?? 0;
  const outputTokens = usage.completion_tokens ?? 0;
  const inputCost = (inputTokens / 1000) * price.price_per_1k_input;
  const outputCost = (outputTokens / 1000) * price.price_per_1k_output;
  const actualCost = Math.round((inputCost + outputCost) * 1e6) / 1e6;

  if (!(await deductBalance(c.env.DB, userId, actualCost))) {
    await refundBalance(c.env.DB, userId, estimatedCost);
    return c.json({ error: { message: 'Balance deduction failed', type: 'invalid_request_error' } }, 402);
  }

  // 10. 记录用量
  const requestId = `chatcmpl-${crypto.randomUUID().slice(0, 8)}`;
  await recordUsage(c.env.DB, userId, apiKeyId, model, inputTokens, outputTokens, actualCost, requestId);

  // 11. 返回
  upstreamJson.id = requestId;
  return c.json(upstreamJson, 200);
});

// GET /v1/models
chat.get('/v1/models', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT model, provider FROM model_price WHERE enabled = 1')
    .all<{ model: string; provider: string }>();

  const data = (results ?? []).map((p) => ({
    id: p.model,
    object: 'model',
    owned_by: p.provider,
    permission: [],
    root: p.model,
  }));

  return c.json({ object: 'list', data }, 200);
});

export { chat };
