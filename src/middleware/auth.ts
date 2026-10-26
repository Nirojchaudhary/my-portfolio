import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';

export async function adminAuth(c: Context<AppEnv>, next: Next) {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = auth.slice(7);

  // Check session in DB
  const session = await c.env.DB.prepare(
    'SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('admin', true);
  await next();
}