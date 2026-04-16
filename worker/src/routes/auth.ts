import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { queryOne, execute } from '../db/index';
import type { Env } from '../db/index';
import { signToken, verifyToken, getCookieName, getExpiryDays } from '../services/jwt';
import { hashPassword, verifyPassword } from '../services/hash';
import type { SafeUser } from '../types';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
auth.post('/register', async (c) => {
  const { email, password, region } = await c.req.json<{
    email?: string;
    password?: string;
    region?: string;
  }>();

  if (!email || !password) {
    return c.json({ success: false, message: '邮箱和密码不能为空' }, 400);
  }
  if (password.length < 6) {
    return c.json({ success: false, message: '密码长度不能少于6位' }, 400);
  }

  const existing = await queryOne<{ id: number }>(c.env.DB, 'SELECT id FROM user WHERE email = ?', email);
  if (existing) {
    return c.json({ success: false, message: '该邮箱已注册' }, 400);
  }

  const hashed = await hashPassword(password);
  const regionValue = region === 'CN' || region === 'OVERSEAS' ? region : null;

  await execute(
    c.env.DB,
    'INSERT INTO user (email, password, balance, region) VALUES (?, ?, ?, ?)',
    email,
    hashed,
    10.0,
    regionValue
  );

  return c.json({ success: true, message: '注册成功' }, 200);
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();

  const user = await queryOne<{
    id: number;
    email: string;
    password: string;
    balance: number;
    role: string;
    region: string | null;
  }>(c.env.DB, 'SELECT * FROM user WHERE email = ?', email);

  if (!user || !(await verifyPassword(password ?? '', user.password))) {
    return c.json({ success: false, message: '邮箱或密码错误' }, 401);
  }

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });

  setCookie(c, getCookieName(), token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: getExpiryDays() * 24 * 60 * 60,
  });

  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    balance: user.balance,
    role: user.role,
    region: user.region,
  };

  return c.json({ success: true, data: { user: safeUser } }, 200);
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  deleteCookie(c, getCookieName());
  return c.json({ success: true, message: '已退出登录' }, 200);
});

export { auth };
