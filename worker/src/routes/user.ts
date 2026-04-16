import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { verifyToken, getCookieName } from '../services/jwt';
import type { SafeUser } from '../types';

const user = new Hono<{ Bindings: Env }>();

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

// GET /api/user/me
user.get('/me', async (c) => {
  const userRecord = await requireAuth(c);
  if (!userRecord) return c.json({ success: false, message: 'Unauthorized' }, 401);
  return c.json({ success: true, data: userRecord }, 200);
});

// PUT /api/user/region
user.put('/region', async (c) => {
  const currentUser = await requireAuth(c);
  if (!currentUser) return c.json({ success: false, message: 'Unauthorized' }, 401);

  const { region } = await c.req.json<{ region?: string }>();
  if (region !== 'CN' && region !== 'OVERSEAS') {
    return c.json({ success: false, message: 'Invalid region value' }, 400);
  }

  await execute(c.env.DB, 'UPDATE user SET region = ? WHERE id = ?', region, currentUser.id);
  return c.json({ success: true, message: 'Region updated' }, 200);
});

export { user };
