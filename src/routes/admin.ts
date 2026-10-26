import { Hono } from 'hono';
import type { AppEnv } from '../types';
import * as db from '../db';

const adminRoutes = new Hono<AppEnv>();

// ============================================
// PROFILE
// ============================================
adminRoutes.put('/profile', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE profile
     SET name = ?, headline = ?, bio = ?, avatar_url = ?, social_links = ?, cover_images = ?, updated_at = datetime('now')
     WHERE id = 1`
  ).bind(
    b.name ?? null,
    b.headline ?? null,
    b.bio ?? null,
    b.avatar_url ?? null,
    JSON.stringify(b.social_links ?? {}),
    JSON.stringify(b.cover_images ?? [])
  ).run();
  return c.json({ success: true });
});

// ============================================
// PROJECTS
// ============================================
adminRoutes.get('/projects', async (c) => c.json(await db.getAllProjects(c.env)));

adminRoutes.post('/projects', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    `INSERT INTO projects (title, description, image_url, live_url, repo_url, tags, sort_order, visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.title ?? null, b.description ?? null, b.image_url ?? null,
    b.live_url ?? null, b.repo_url ?? null, JSON.stringify(b.tags ?? []),
    b.sort_order ?? 0, b.visible === false ? 0 : 1
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/projects/:id', async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE projects
     SET title = ?, description = ?, image_url = ?, live_url = ?, repo_url = ?, tags = ?, sort_order = ?, visible = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    b.title ?? null, b.description ?? null, b.image_url ?? null,
    b.live_url ?? null, b.repo_url ?? null, JSON.stringify(b.tags ?? []),
    b.sort_order ?? 0, b.visible === false ? 0 : 1, id
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/projects/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ============================================
// ABOUT
// ============================================
adminRoutes.put('/about', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE about
     SET heading = ?, subheading = ?, body = ?, stats = ?, updated_at = datetime('now')
     WHERE id = 1`
  ).bind(
    b.heading ?? null, b.subheading ?? null, b.body ?? null,
    JSON.stringify(b.stats ?? [])
  ).run();
  return c.json({ success: true });
});

// ============================================
// SKILLS
// ============================================
adminRoutes.get('/skills', async (c) => c.json(await db.getSkills(c.env, false)));

adminRoutes.post('/skills', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    'INSERT INTO skills (category, items, sort_order, visible) VALUES (?, ?, ?, ?)'
  ).bind(
    b.category ?? null, JSON.stringify(b.items ?? []),
    b.sort_order ?? 0, b.visible === false ? 0 : 1
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/skills/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE skills SET category = ?, items = ?, sort_order = ?, visible = ? WHERE id = ?'
  ).bind(
    b.category ?? null, JSON.stringify(b.items ?? []),
    b.sort_order ?? 0, b.visible === false ? 0 : 1, c.req.param('id')
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/skills/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM skills WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ============================================
// EXPERIENCE
// ============================================
adminRoutes.get('/experience', async (c) => c.json(await db.getExperience(c.env, false)));

adminRoutes.post('/experience', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    `INSERT INTO experience (role, company, location, start_date, end_date, description, sort_order, visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.role ?? null, b.company ?? null, b.location ?? null,
    b.start_date ?? null, b.end_date ?? null, b.description ?? null,
    b.sort_order ?? 0, b.visible === false ? 0 : 1
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/experience/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE experience
     SET role = ?, company = ?, location = ?, start_date = ?, end_date = ?, description = ?, sort_order = ?, visible = ?
     WHERE id = ?`
  ).bind(
    b.role ?? null, b.company ?? null, b.location ?? null,
    b.start_date ?? null, b.end_date ?? null, b.description ?? null,
    b.sort_order ?? 0, b.visible === false ? 0 : 1, c.req.param('id')
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/experience/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM experience WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ============================================
// EDUCATION
// ============================================
adminRoutes.get('/education', async (c) => c.json(await db.getEducation(c.env, false)));

adminRoutes.post('/education', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    `INSERT INTO education (degree, institution, location, start_date, end_date, description, sort_order, visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.degree ?? null, b.institution ?? null, b.location ?? null,
    b.start_date ?? null, b.end_date ?? null, b.description ?? null,
    b.sort_order ?? 0, b.visible === false ? 0 : 1
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/education/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE education
     SET degree = ?, institution = ?, location = ?, start_date = ?, end_date = ?, description = ?, sort_order = ?, visible = ?
     WHERE id = ?`
  ).bind(
    b.degree ?? null, b.institution ?? null, b.location ?? null,
    b.start_date ?? null, b.end_date ?? null, b.description ?? null,
    b.sort_order ?? 0, b.visible === false ? 0 : 1, c.req.param('id')
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/education/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM education WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ============================================
// SERVICES
// ============================================
adminRoutes.get('/services', async (c) => c.json(await db.getServices(c.env, false)));

adminRoutes.post('/services', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    'INSERT INTO services (icon, title, description, sort_order, visible) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    b.icon ?? null, b.title ?? null, b.description ?? null,
    b.sort_order ?? 0, b.visible === false ? 0 : 1
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/services/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE services SET icon = ?, title = ?, description = ?, sort_order = ?, visible = ? WHERE id = ?'
  ).bind(
    b.icon ?? null, b.title ?? null, b.description ?? null,
    b.sort_order ?? 0, b.visible === false ? 0 : 1, c.req.param('id')
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/services/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ============================================
// TESTIMONIALS
// ============================================
adminRoutes.get('/testimonials', async (c) => c.json(await db.getTestimonials(c.env, false)));

adminRoutes.post('/testimonials', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    'INSERT INTO testimonials (quote, author, role, avatar_url, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    b.quote ?? null, b.author ?? null, b.role ?? null,
    b.avatar_url ?? null, b.sort_order ?? 0, b.visible === false ? 0 : 1
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/testimonials/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE testimonials SET quote = ?, author = ?, role = ?, avatar_url = ?, sort_order = ?, visible = ? WHERE id = ?'
  ).bind(
    b.quote ?? null, b.author ?? null, b.role ?? null,
    b.avatar_url ?? null, b.sort_order ?? 0, b.visible === false ? 0 : 1, c.req.param('id')
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/testimonials/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM testimonials WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ============================================
// SITE CONFIG
// ============================================
adminRoutes.put('/config', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE site_config
     SET site_title = ?, meta_description = ?, accent_color = ?, accent_color_2 = ?,
         resume_url = ?, contact_email = ?, sections_visible = ?, footer_text = ?,
         available_for_work = ?, availability_text = ?, updated_at = datetime('now')
     WHERE id = 1`
  ).bind(
    b.site_title ?? null,
    b.meta_description ?? null,
    b.accent_color ?? '#38bdf8',
    b.accent_color_2 ?? '#7dd3fc',
    b.resume_url ?? null,
    b.contact_email ?? null,
    JSON.stringify(b.sections_visible ?? {}),
    b.footer_text ?? null,
    b.available_for_work ? 1 : 0,
    b.availability_text ?? 'Available for work'
  ).run();
  return c.json({ success: true });
});

// ============================================
// CONTACT MESSAGES
// ============================================
adminRoutes.get('/messages', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM contact_messages ORDER BY created_at DESC'
  ).all();
  return c.json(results);
});

adminRoutes.put('/messages/:id/read', async (c) => {
  await c.env.DB.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?')
    .bind(c.req.param('id')).run();
  return c.json({ success: true });
});

adminRoutes.delete('/messages/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM contact_messages WHERE id = ?')
    .bind(c.req.param('id')).run();
  return c.json({ success: true });
});


// ============================================
// BLOG POSTS
// ============================================

adminRoutes.get('/posts', async (c) => {
  return c.json(await db.getAllPosts(c.env));
});

adminRoutes.post('/posts', async (c) => {
  const b = await c.req.json();
  if (!b.title || !b.slug) {
    return c.json({ error: 'Title and slug are required' }, 400);
  }
  const published = b.published ? 1 : 0;
  const publishedAt = published ? (b.published_at || new Date().toISOString()) : null;
  const r = await c.env.DB.prepare(
    `INSERT INTO posts (slug, title, excerpt, content, cover_image, tags, published, published_at, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.slug,
    b.title,
    b.excerpt ?? null,
    b.content ?? null,
    b.cover_image ?? null,
    JSON.stringify(b.tags ?? []),
    published,
    publishedAt,
    b.sort_order ?? 0
  ).run();
  return c.json({ success: true, id: r.meta.last_row_id }, 201);
});

adminRoutes.put('/posts/:id', async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const published = b.published ? 1 : 0;
  const publishedAt = published ? (b.published_at || new Date().toISOString()) : null;
  await c.env.DB.prepare(
    `UPDATE posts
     SET slug = ?, title = ?, excerpt = ?, content = ?, cover_image = ?, tags = ?, published = ?, published_at = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    b.slug,
    b.title,
    b.excerpt ?? null,
    b.content ?? null,
    b.cover_image ?? null,
    JSON.stringify(b.tags ?? []),
    published,
    publishedAt,
    b.sort_order ?? 0,
    id
  ).run();
  return c.json({ success: true });
});

adminRoutes.delete('/posts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default adminRoutes;