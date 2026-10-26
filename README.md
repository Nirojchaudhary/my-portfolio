# Portfolio — Cloudflare Workers + D1

A personal portfolio website with a full admin panel, hosted entirely on Cloudflare's edge. No build step, no framework, no server.

**Live site:** https://my-portfolio.seebakattendance.workers.dev
**Admin:** https://my-portfolio.seebakattendance.workers.dev/admin

---

## Table of contents

1. [What this is](#what-this-is)
2. [Features](#features)
3. [Stack](#stack)
4. [Project structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [First-time setup](#first-time-setup)
7. [Daily commands](#daily-commands)
8. [How to update content](#how-to-update-content)
9. [How to add a new section](#how-to-add-a-new-section)
10. [Database schema](#database-schema)
11. [API reference](#api-reference)
12. [Environment variables & secrets](#environment-variables--secrets)
13. [Backup & restore](#backup--restore)
14. [Troubleshooting](#troubleshooting)
15. [Cost](#cost)
16. [Roadmap](#roadmap)
17. [Changelog](#changelog)

---

## What this is

A personal portfolio site with:

- **Public site** — hero carousel, about, skills, experience, education, services, projects, testimonials, contact form
- **Admin panel** — edit every section from a web UI
- **Backend API** — Cloudflare Worker serving JSON and static assets
- **Database** — Cloudflare D1 (SQLite at the edge)
- **Auth** — Bearer token stored as a Cloudflare secret

Everything lives in one Worker. Static files (HTML/CSS/JS) are served from Workers Static Assets (free, unlimited). Only API calls and admin operations hit the Worker.

---

## Features

### Public site
- Full-width hero carousel (auto-advance 5s, pause on hover, swipe on mobile)
- Avatar + name + headline + bio overlaid on carousel
- Social link pills (top-right of hero)
- About section with stats grid
- Skills grid with categories and chips
- Experience timeline
- Education timeline
- Services cards
- Projects grid (image, tags, live + repo links)
- Testimonials grid
- Contact section with dynamic buttons + contact form
- Dark/light mode toggle (saved in localStorage)
- Scroll progress bar at top
- Active section highlight in nav
- Back-to-top button
- Smooth scroll, reveal-on-scroll animations
- Custom 404 page
- SEO: dynamic title, meta description, Open Graph
- Accessibility: skip-link, ARIA labels, keyboard nav

### Admin panel
- Token login (stored in localStorage)
- Dashboard with counts (projects, skills, messages, unread)
- **Profile** — name, headline, bio, avatar, social links, carousel images
- **About** — heading, subheading, body, editable stats
- **Skills** — CRUD categories with items
- **Experience** — CRUD with dates, description
- **Education** — CRUD with dates, description
- **Services** — CRUD with emoji icon
- **Projects** — CRUD with image, tags, links
- **Testimonials** — CRUD with quote, author, role, avatar
- **Messages** — view/mark-read/delete contact form submissions
- **Settings** — site title, description, accent colors, resume URL, contact email, footer text, toggle visible sections

### Backend API
- Single `/api/all` endpoint returning the whole site in one call
- Separate endpoints for each section
- Admin endpoints protected by Bearer token
- Parameterized SQL queries (no injection)
- Handles `undefined` → `null` safely for D1

---

## Stack

| Layer | Technology |
|---|---|
| Hosting | Cloudflare Workers |
| Static assets | Workers Static Assets (free, unlimited) |
| Database | Cloudflare D1 (SQLite at edge) |
| Backend framework | Hono |
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Auth | Bearer token (Cloudflare secret) |
| Language | TypeScript |

---

## Project structure
my-portfolio/
├── migrations/ D1 SQL migrations
│ ├── 0001_init.sql Initial tables (profile, projects)
│ ├── 0002_content.sql All sections (about, skills, etc.)
│ └── 0003_cover.sql Carousel images column
├── public/ Static site (served from edge)
│ ├── index.html Public site
│ ├── admin.html Admin panel
│ ├── 404.html Custom 404 page
│ ├── css/
│ │ ├── base.css Reset, variables, buttons
│ │ ├── public.css Public site styles
│ │ └── admin.css Admin panel styles
│ └── js/
│ ├── api.js Shared fetch helpers
│ ├── public.js Public site logic
│ └── admin.js Admin logic
├── src/ Worker code
│ ├── index.ts Entry point + routing
│ ├── types.ts TypeScript types
│ ├── db.ts Database helper functions
│ ├── routes/
│ │ ├── public.ts Public API endpoints
│ │ └── admin.ts Admin API endpoints
│ └── middleware/
│ └── auth.ts Bearer token validation
├── wrangler.jsonc Cloudflare config
├── package.json Dependencies + scripts
├── tsconfig.json TypeScript config
└── README.md This file

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **Cloudflare account** (free) — [signup](https://dash.cloudflare.com/sign-up)
- **VS Code** (recommended) — [download](https://code.visualstudio.com)
- **PowerShell** (Windows) with execution policy `RemoteSigned`:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned




token=a564c1a4-61c9-4135-a3d1-704809a3dd9c



##Full reset (delete everything and start clean)
|Delete all rows (keeps table structure)
|npx wrangler d1 execute portfolio-db --remote --command="DELETE FROM projects"
|npx wrangler d1 execute portfolio-db --remote --command="DELETE FROM skills"
|
|# Or nuke and rebuild
|npx wrangler d1 delete portfolio-db
|npx wrangler d1 create portfolio-db
|# update wrangler.jsonc with new database_id
|# re-run all migrations