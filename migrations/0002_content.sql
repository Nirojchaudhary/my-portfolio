-- ============================================
-- ABOUT
-- ============================================
CREATE TABLE IF NOT EXISTS about (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  heading TEXT NOT NULL DEFAULT 'About Me',
  subheading TEXT DEFAULT 'A quick introduction',
  body TEXT,
  stats TEXT,  -- JSON array: [{"number":"3+","label":"Years Coding"}, ...]
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO about (id) VALUES (1);

-- ============================================
-- SKILLS
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  items TEXT NOT NULL,   -- JSON array of strings
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- EXPERIENCE
-- ============================================
CREATE TABLE IF NOT EXISTS experience (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date TEXT NOT NULL,   -- "2023-01"
  end_date TEXT,              -- NULL means "Present"
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- EDUCATION
-- ============================================
CREATE TABLE IF NOT EXISTS education (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icon TEXT,                 -- emoji or short text
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- TESTIMONIALS
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- SITE CONFIG (single row)
-- ============================================
CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  site_title TEXT DEFAULT 'Portfolio',
  meta_description TEXT DEFAULT 'Personal portfolio',
  accent_color TEXT DEFAULT '#38bdf8',
  accent_color_2 TEXT DEFAULT '#7dd3fc',
  resume_url TEXT,
  contact_email TEXT,
  sections_visible TEXT DEFAULT '{"about":true,"skills":true,"experience":true,"education":true,"services":true,"projects":true,"testimonials":true,"contact":true}',
  footer_text TEXT DEFAULT 'Built with Cloudflare Workers',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_config (id) VALUES (1);

-- ============================================
-- CONTACT MESSAGES (form submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);