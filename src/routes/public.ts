import { Hono } from 'hono';
import type { AppEnv } from '../types';
import * as db from '../db';
import { hashPassword, verifyPassword, generateSessionToken } from '../auth';

const publicRoutes = new Hono<AppEnv>();

// ============================================
// PUBLIC SITE DATA
// ============================================

publicRoutes.get('/all', async (c) => {
  const data = await db.getAllSiteData(c.env);
  return c.json(data);
});

publicRoutes.get('/profile', async (c) => {
  return c.json(await db.getProfile(c.env));
});

publicRoutes.get('/projects', async (c) => {
  return c.json(await db.getVisibleProjects(c.env));
});

publicRoutes.get('/about', async (c) => {
  return c.json(await db.getAbout(c.env));
});

publicRoutes.get('/skills', async (c) => {
  return c.json(await db.getSkills(c.env, true));
});

publicRoutes.get('/experience', async (c) => {
  return c.json(await db.getExperience(c.env, true));
});

publicRoutes.get('/education', async (c) => {
  return c.json(await db.getEducation(c.env, true));
});

publicRoutes.get('/services', async (c) => {
  return c.json(await db.getServices(c.env, true));
});

publicRoutes.get('/testimonials', async (c) => {
  return c.json(await db.getTestimonials(c.env, true));
});

publicRoutes.get('/config', async (c) => {
  return c.json(await db.getConfig(c.env));
});

// ============================================
// CONTACT FORM
// ============================================

publicRoutes.post('/contact', async (c) => {
  const body = await c.req.json();
  if (!body.name || !body.email || !body.message) {
    return c.json({ error: 'Name, email and message are required' }, 400);
  }
  await c.env.DB.prepare(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
  ).bind(
    body.name ?? null,
    body.email ?? null,
    body.subject ?? null,
    body.message ?? null
  ).run();
  return c.json({ success: true }, 201);
});

// ============================================
// AUTH — LOGIN / LOGOUT / SESSION
// ============================================

publicRoutes.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM admin_users WHERE username = ?'
  ).bind(username).first<{ username: string; password_hash: string }>();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await c.env.DB.prepare(
    'INSERT INTO admin_sessions (token, username, expires_at) VALUES (?, ?, ?)'
  ).bind(token, username, expiresAt).run();

  return c.json({ success: true, token, expires_at: expiresAt });
});

publicRoutes.post('/logout', async (c) => {
  const auth = c.req.header('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run();
  }
  return c.json({ success: true });
});

publicRoutes.get('/me', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ authenticated: false }, 401);
  }
  const token = auth.slice(7);
  const session = await c.env.DB.prepare(
    'SELECT username, expires_at FROM admin_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<{ username: string; expires_at: string }>();
  if (!session) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, username: session.username, expires_at: session.expires_at });
});

publicRoutes.post('/setup-admin', async (c) => {
  const existing = await c.env.DB.prepare(
    'SELECT COUNT(*) as c FROM admin_users'
  ).first<{ c: number }>();

  if (existing && existing.c > 0) {
    return c.json({ error: 'Admin already exists. Use login instead.' }, 400);
  }

  const { username, password } = await c.req.json();
  if (!username || !password || password.length < 8) {
    return c.json({ error: 'Username and password (min 8 chars) required' }, 400);
  }

  const hash = await hashPassword(password);
  await c.env.DB.prepare(
    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)'
  ).bind(username, hash).run();

  return c.json({ success: true, message: 'Admin created. You can now log in.' }, 201);
});

publicRoutes.post('/change-password', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  const session = await c.env.DB.prepare(
    'SELECT username FROM admin_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<{ username: string }>();
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const { current_password, new_password } = await c.req.json();
  if (!current_password || !new_password || new_password.length < 8) {
    return c.json({ error: 'Current password and new password (min 8 chars) required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT password_hash FROM admin_users WHERE username = ?'
  ).bind(session.username).first<{ password_hash: string }>();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const ok = await verifyPassword(current_password, user.password_hash);
  if (!ok) return c.json({ error: 'Current password is incorrect' }, 401);

  const newHash = await hashPassword(new_password);
  await c.env.DB.prepare(
    'UPDATE admin_users SET password_hash = ? WHERE username = ?'
  ).bind(newHash, session.username).run();

  await c.env.DB.prepare(
    'DELETE FROM admin_sessions WHERE username = ? AND token != ?'
  ).bind(session.username, token).run();

  return c.json({ success: true });
});

publicRoutes.get('/admin-exists', async (c) => {
  const existing = await c.env.DB.prepare(
    'SELECT COUNT(*) as c FROM admin_users'
  ).first<{ c: number }>();
  return c.json({ exists: !!(existing && existing.c > 0) });
});

// ============================================
// SITEMAP
// ============================================

publicRoutes.get('/sitemap.xml', async (c) => {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const today = new Date().toISOString().split('T')[0];

  const sections = [
    { path: '/', priority: '1.0' },
    { path: '/#section-about', priority: '0.8' },
    { path: '/#section-skills', priority: '0.8' },
    { path: '/#section-experience', priority: '0.7' },
    { path: '/#section-education', priority: '0.6' },
    { path: '/#section-services', priority: '0.8' },
    { path: '/#section-projects', priority: '0.9' },
    { path: '/#section-testimonials', priority: '0.6' },
    { path: '/#section-contact', priority: '0.9' },
  ];

  const urls = sections.map(s => `
  <url>
    <loc>${origin}${s.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${s.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// ============================================
// RSS FEED
// ============================================

publicRoutes.get('/rss.xml', async (c) => {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const config = await db.getConfig(c.env);
  const projects = await db.getVisibleProjects(c.env);

  const siteTitle = (config?.site_title as string) || 'Portfolio';
  const siteDesc = (config?.meta_description as string) || 'Personal portfolio';
  const now = new Date().toUTCString();

  const items = projects.map((p: any) => {
    const pubDate = p.created_at
      ? new Date(p.created_at).toUTCString()
      : now;
    return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${origin}/#project-${p.id}</link>
      <guid isPermaLink="false">${origin}/#project-${p.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.description || '')}</description>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${origin}</link>
    <description>${escapeXml(siteDesc)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
});

// Helper — accepts any type (handles unknown from D1)
function escapeXml(s: unknown): string {
  return String(s ?? '').replace(/[<>&'"]/g, (ch) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[ch] as string));
}


// ============================================
// BLOG
// ============================================

publicRoutes.get('/posts', async (c) => {
  return c.json(await db.getPublishedPosts(c.env));
});

publicRoutes.get('/posts/:slug', async (c) => {
  const post = await db.getPostBySlug(c.env, c.req.param('slug'));
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

export default publicRoutes;