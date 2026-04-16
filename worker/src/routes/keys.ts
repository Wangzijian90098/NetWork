import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { query, queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import type { ApiKey, SafeUser } from '../types';

const keys = new Hono<{ Bindings: Env }>();

async function requireAuth(c: any): Promise<SafeUser | null> {
  const token = getCookie(c, getCookieName());
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return queryOne<SafeUser>(
    c.env.DB,
    'SELECT id, email, balance, role, region FROM user WHERE id = ?',
    payload.sub
  );
}

function randomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk-aihub-';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (const b of array) result += chars[b % chars.length];
  return result;
}

// GET /api/keys
keys.get('/', async (c) => {
  const user = await requireAuth(c);
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const rows = await query<ApiKey>(
    c.env.DB,
    'SELECT id, user_id, key_name, token, status, created_at FROM api_key WHERE user_id = ?',
    user.id
  );

  return c.json({ success: true, data: rows }, 200);
});

// POST /api/keys
keys.post('/', async (c) => {
  const user = await requireAuth(c);
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const { name } = await c.req.json<{ name?: string }>();
  const token = randomKey();

  const info = await execute(
    c.env.DB,
    'INSERT INTO api_key (user_id, key_name, token) VALUES (?, ?, ?)',
    user.id,
    name ?? '默认 Key',
    token
  );

  const row = await queryOne<ApiKey>(c.env.DB, 'SELECT * FROM api_key WHERE id = ?', info.lastInsertRowid);

  return c.json({ success: true, data: row }, 200);
});

// DELETE /api/keys/:id
keys.delete('/:id', async (c) => {
  const user = await requireAuth(c);
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const keyId = Number(c.req.param('id'));
  const info = await execute(
    c.env.DB,
    "UPDATE api_key SET status = 'revoked' WHERE id = ? AND user_id = ? AND status = 'active'",
    keyId,
    user.id
  );

  if (info.changes === 0) {
    return c.json({ success: false, message: 'Key not found or already revoked' }, 404);
  }
  return c.json({ success: true, message: 'Key revoked' }, 200);
});

export { keys };
