# Portfolio — Cloudflare Workers + D1

A personal portfolio website with a full admin panel, hosted entirely on Cloudflare's edge. No build step, no frontend framework, no traditional server.

**Live site:** https://nirojchaudhary.com.np
**Admin:** https://nirojchaudhary.com.np/admin

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
9. [Database schema](#database-schema)
10. [API reference](#api-reference)
11. [Environment variables & secrets](#environment-variables--secrets)
12. [Backup & restore](#backup--restore)
13. [Troubleshooting](#troubleshooting)
14. [Cost](#cost)

---

## What this is

A personal portfolio site with:

- **Public site** — hero carousel, about, skills, experience, education, services, projects, blog, testimonials, contact form, particle background, and dark/light mode.
- **Admin panel** — edit every section from a secure web UI.
- **Backend API** — Cloudflare Worker serving JSON and static assets.
- **Database** — Cloudflare D1 (SQLite at the edge).
- **Auth** — Username/password with secure PBKDF2 hashing and session tokens.

Everything lives in one Worker. Static files (HTML/CSS/JS) are served from Workers Static Assets. API calls and admin operations hit the Worker.

---

## Features

### Public site
- Full-width hero carousel with auto-advance, pause on hover, swipe on mobile.
- Avatar, name, headline, bio, and social pills overlaid on the hero.
- Particle network background with interactive click effects.
- Custom animated cursor (desktop only).
- Availability badge ("Available for work").
- About section with stats grid.
- Skills grid with categories.
- Experience and Education timelines.
- Services cards.
- Projects grid with tag filtering, project modals, and deep links (`/#project-2`).
- Blog section with post modals.
- Testimonials carousel.
- Contact section with dynamic buttons and a validated contact form.
- Floating resume button (changes position on refresh).
- Dark/light mode toggle (saved in localStorage).
- Scroll progress bar, active nav highlight, back-to-top button.
- SEO: Dynamic sitemap, RSS feed, JSON-LD schema, Open Graph tags, custom 404.
- Accessibility: Skip-link, ARIA labels, keyboard navigation.

### Admin panel (`/admin`)
- Secure login (Username + Password).
- Dashboard with counts (projects, messages, unread).
- **Profile** — Name, headline, bio, avatar, social links, hero carousel images.
- **About** — Heading, subheading, body, editable stats.
- **Skills** — CRUD categories with items.
- **Experience** — CRUD with dates and descriptions.
- **Education** — CRUD with dates and descriptions.
- **Services** — CRUD with emoji icons.
- **Projects** — CRUD with images, tags, live/repo links.
- **Blog** — CRUD with slug, excerpt, content, publishing status.
- **Testimonials** — CRUD with quote, author, role, avatar.
- **Messages** — View, mark as read, or delete contact form submissions.
- **Settings** — Site title, description, accent colors, resume URL, contact email, footer text, toggle visible sections, and availability badge.

---

## Stack

| Layer | Technology |
|---|---|
| Hosting | Cloudflare Workers |
| Static assets | Workers Static Assets |
| Database | Cloudflare D1 (SQLite) |
| Backend framework | Hono |
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Auth | PBKDF2 hashing + Session Tokens |
| Language | TypeScript |

---

## Project structure

```text
my-portfolio/
├── migrations/                    D1 SQL migrations
│   ├── 0001_init.sql              Initial tables
│   ├── 0002_content.sql           Additional sections
│   ├── 0003_cover.sql             Carousel images column
│   ├── 0004_admin_users.sql       Auth tables
│   ├── 0005_available.sql         Availability badge
│   └── 0007_blog.sql              Blog posts table
├── public/                        Static site (served from edge)
│   ├── index.html                 Public site
│   ├── admin.html                 Admin panel
│   ├── 404.html                   Custom 404 page
│   ├── css/                       Stylesheets (base, public, admin)
│   └── js/                        Client scripts (api, public, admin)
├── src/                           Worker code
│   ├── index.ts                   Entry point + routing
│   ├── auth.ts                    Password hashing utilities
│   ├── db.ts                      Database helper functions
│   ├── types.ts                   TypeScript types
│   ├── routes/                    API endpoints (public, admin)
│   └── middleware/                Auth validation
├── wrangler.jsonc                 Cloudflare config
├── package.json                   Dependencies + scripts
├── tsconfig.json                  TypeScript config
└── README.md                      This file