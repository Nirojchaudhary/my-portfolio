-- Table for portfolio projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  live_url TEXT,
  repo_url TEXT,
  tags TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table for personal profile (only one row)
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  social_links TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert a default empty profile row
INSERT OR IGNORE INTO profile (id, name) VALUES (1, 'Your Name');