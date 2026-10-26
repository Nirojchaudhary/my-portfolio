import { Hono } from 'hono';
import type { AppEnv } from './types';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { adminAuth } from './middleware/auth';

const app = new Hono<AppEnv>();

// Public API (mounted under /api)
app.route('/api', publicRoutes);

// Admin API (all routes protected)
app.use('/api/admin/*', adminAuth);
app.route('/api/admin', adminRoutes);

// ---------- SITEMAP (root-level) ----------
app.get('/sitemap.xml', async (c) => {
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

// ---------- RSS (root-level) ----------
app.get('/rss.xml', async (c) => {
  const url = new URL(c.req.url);
  const origin = url.origin;

  const config: any = await c.env.DB.prepare(
    'SELECT * FROM site_config WHERE id = 1'
  ).first();

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE visible = 1 ORDER BY sort_order ASC, created_at DESC'
  ).all();
  const projects = results || [];

  const siteTitle = config?.site_title || 'Portfolio';
  const siteDesc = config?.meta_description || 'Personal portfolio';
  const now = new Date().toUTCString();

  const escapeXml = (s: unknown): string =>
    String(s ?? '').replace(/[<>&'"]/g, ch => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
    }[ch] as string));

  const items = projects.map((p: any) => {
    const pubDate = p.created_at ? new Date(p.created_at).toUTCString() : now;
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

// ---------- ADMIN HTML ----------
// Serve /admin as admin.html
// Serve /admin as admin.html
app.get('/admin', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/admin.html';
  // Make a fresh request, bypassing the Worker route matching
  const assetResponse = await c.env.ASSETS.fetch(
    new Request(url.toString(), {
      method: 'GET',
      headers: c.req.raw.headers,
    })
  );
  return assetResponse;
});

// ---------- STATIC ASSETS (catch-all) ----------
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;