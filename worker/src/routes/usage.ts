import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { query } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import type { UsageLog } from '../types';

const usage = new Hono<{ Bindings: Env }>();

async function getUserId(c: any): Promise<number | null> {
  const token = getCookie(c, getCookieName());
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.sub ?? null;
}

// GET /v1/account/usage?days=30
usage.get('/v1/account/usage', async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const days = Number(c.req.query('days') ?? '30');

  const logs = await query<UsageLog>(
    c.env.DB,
    `SELECT * FROM usage_log
     WHERE user_id = ? AND request_time >= datetime('now', '-${Number(days)} days')
     ORDER BY request_time DESC`,
    userId
  );

  const totalInput = logs.reduce((s, l) => s + l.input_tokens, 0);
  const totalOutput = logs.reduce((s, l) => s + l.output_tokens, 0);
  const totalCost = logs.reduce((s, l) => s + l.cost, 0);

  return c.json({
    success: true,
    data: {
      logs,
      summary: {
        totalInput,
        totalOutput,
        totalCost: Math.round(totalCost * 1e6) / 1e6,
        requestCount: logs.length,
      },
    },
  }, 200);
});

export { usage };
