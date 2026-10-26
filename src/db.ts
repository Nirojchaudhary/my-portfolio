import type { Env } from './types';

// ============================================
// PROFILE
// ============================================
export async function getProfile(env: Env) {
  return env.DB.prepare('SELECT * FROM profile WHERE id = 1').first();
}

// ============================================
// PROJECTS
// ============================================
export async function getVisibleProjects(env: Env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM projects WHERE visible = 1 ORDER BY sort_order ASC, created_at DESC'
  ).all();
  return results || [];
}

export async function getAllProjects(env: Env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC'
  ).all();
  return results || [];
}

// ============================================
// ABOUT
// ============================================
export async function getAbout(env: Env) {
  return env.DB.prepare('SELECT * FROM about WHERE id = 1').first();
}

// ============================================
// SKILLS
// ============================================
export async function getSkills(env: Env, onlyVisible = true) {
  const sql = onlyVisible
    ? 'SELECT * FROM skills WHERE visible = 1 ORDER BY sort_order ASC, category ASC'
    : 'SELECT * FROM skills ORDER BY sort_order ASC, category ASC';
  const { results } = await env.DB.prepare(sql).all();
  return results || [];
}

// ============================================
// EXPERIENCE
// ============================================
export async function getExperience(env: Env, onlyVisible = true) {
  const sql = onlyVisible
    ? 'SELECT * FROM experience WHERE visible = 1 ORDER BY sort_order ASC, start_date DESC'
    : 'SELECT * FROM experience ORDER BY sort_order ASC, start_date DESC';
  const { results } = await env.DB.prepare(sql).all();
  return results || [];
}

// ============================================
// EDUCATION
// ============================================
export async function getEducation(env: Env, onlyVisible = true) {
  const sql = onlyVisible
    ? 'SELECT * FROM education WHERE visible = 1 ORDER BY sort_order ASC, start_date DESC'
    : 'SELECT * FROM education ORDER BY sort_order ASC, start_date DESC';
  const { results } = await env.DB.prepare(sql).all();
  return results || [];
}

// ============================================
// SERVICES
// ============================================
export async function getServices(env: Env, onlyVisible = true) {
  const sql = onlyVisible
    ? 'SELECT * FROM services WHERE visible = 1 ORDER BY sort_order ASC'
    : 'SELECT * FROM services ORDER BY sort_order ASC';
  const { results } = await env.DB.prepare(sql).all();
  return results || [];
}

// ============================================
// TESTIMONIALS
// ============================================
export async function getTestimonials(env: Env, onlyVisible = true) {
  const sql = onlyVisible
    ? 'SELECT * FROM testimonials WHERE visible = 1 ORDER BY sort_order ASC'
    : 'SELECT * FROM testimonials ORDER BY sort_order ASC';
  const { results } = await env.DB.prepare(sql).all();
  return results || [];
}

// ============================================
// SITE CONFIG
// ============================================
export async function getConfig(env: Env) {
  return env.DB.prepare('SELECT * FROM site_config WHERE id = 1').first();
}

// ============================================
// BLOG / POSTS (Wave 5)
// ============================================
export async function getPublishedPosts(env: Env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, created_at DESC'
  ).all();
  return results || [];
}

export async function getAllPosts(env: Env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM posts ORDER BY published_at DESC, created_at DESC'
  ).all();
  return results || [];
}

export async function getPostBySlug(env: Env, slug: string) {
  return env.DB.prepare('SELECT * FROM posts WHERE slug = ?').bind(slug).first();
}

// ============================================
// ALL-IN-ONE (used by /api/all)
// ============================================
export async function getAllSiteData(env: Env) {
  const [
    profile, projects, about, skills, experience,
    education, services, testimonials, config, posts
  ] = await Promise.all([
    getProfile(env),
    getVisibleProjects(env),
    getAbout(env),
    getSkills(env, true),
    getExperience(env, true),
    getEducation(env, true),
    getServices(env, true),
    getTestimonials(env, true),
    getConfig(env),
    getPublishedPosts(env),
  ]);

  return {
    profile,
    projects,
    about,
    skills,
    experience,
    education,
    services,
    testimonials,
    config,
    posts,
  };
}