import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { query, queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';

const admin = new Hono<{ Bindings: Env }>();

async function requireAdmin(c: any): Promise<boolean> {
  const token = getCookie(c, getCookieName());
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}

// GET /api/admin/users
admin.get('/users', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const rows = await query(
    c.env.DB,
    'SELECT id, email, balance, role, region, created_at FROM user ORDER BY id'
  );
  return c.json({ success: true, data: rows }, 200);
});

// POST /api/admin/recharge
admin.post('/recharge', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const { userId, amount } = await c.req.json<{ userId?: number; amount?: number }>();
  if (!userId || !amount || amount <= 0) {
    return c.json({ success: false, message: 'Invalid params' }, 400);
  }
  await execute(c.env.DB, 'UPDATE user SET balance = balance + ? WHERE id = ?', amount, userId);
  return c.json({ success: true, message: 'Recharged' }, 200);
});

// GET /api/admin/platform-keys
admin.get('/platform-keys', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const rows = await query(c.env.DB, 'SELECT * FROM platform_key ORDER BY id');
  return c.json({ success: true, data: rows }, 200);
});

// POST /api/admin/platform-keys
admin.post('/platform-keys', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const { provider, key_token, base_url, region } = await c.req.json<{
    provider?: string;
    key_token?: string;
    base_url?: string;
    region?: string;
  }>();
  if (!provider || !key_token) {
    return c.json({ success: false, message: 'provider and key_token required' }, 400);
  }
  const info = await execute(
    c.env.DB,
    'INSERT INTO platform_key (provider, key_token, base_url, region) VALUES (?, ?, ?, ?)',
    provider,
    key_token,
    base_url ?? null,
    region ?? 'GLOBAL'
  );
  const row = await queryOne(c.env.DB, 'SELECT * FROM platform_key WHERE id = ?', info.lastInsertRowid);
  return c.json({ success: true, data: row }, 200);
});

// DELETE /api/admin/platform-keys/:id
admin.delete('/platform-keys/:id', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
  const id = Number(c.req.param('id'));
  await execute(c.env.DB, 'DELETE FROM platform_key WHERE id = ?', id);
  return c.json({ success: true, message: 'Deleted' }, 200);
});

export { admin };
