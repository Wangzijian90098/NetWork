import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import { verifyToken, getCookieName } from './services/jwt';
import { queryOne } from './db/index';
import { auth } from './routes/auth';
import { keys } from './routes/keys';
import { chat } from './routes/chat';
import { user } from './routes/user';
import { usage } from './routes/usage';
import { admin } from './routes/admin';
import type { Env } from './db/index';
import type { SafeUser, AuthVariables } from './types';

const app = new Hono<{ Bindings: Env; Variables: { user?: SafeUser } }>();

// CORS — 允许所有来源（Workers 通过 Cloudflare Pages 代理时同域）
app.use('/*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 注入用户上下文（对所有需要认证的路由）
app.use('/*', async (c, next) => {
  const token = getCookie(c, getCookieName());
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const safeUser = await queryOne<SafeUser>(
        c.env.DB,
        'SELECT id, email, balance, role, region FROM user WHERE id = ?',
        payload.sub
      );
      c.set('user', safeUser ?? undefined);
    }
  }
  await next();
});

// 挂载路由
app.route('/api/auth', auth);
app.route('/api/keys', keys);
app.route('/api/user', user);
app.route('/api/admin', admin);
app.route('/', usage);
app.route('/', chat);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', service: 'aihubs-worker' }));

export default {
  fetch: app.fetch,
};
