// ============================================
// PUBLIC SITE LOGIC — with all features
// ============================================

let siteData = {};

let projectFilter = {
  active: 'all',
  allTags: [],
};

let testimonialsState = {
  current: 0,
  total: 0,
  timer: null,
  paused: false,
};

let carouselState = {
  current: 0,
  total: 1,
  timer: null,
  paused: false,
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  initTheme();
  initScrollProgress();
  initBackToTop();
  initScrollSpy();
  initSmoothScroll();

  try {
    siteData = await apiGet('/all');
    window.siteData = siteData;
    renderConfig(siteData.config);
    renderProfile(siteData.profile);
    renderAbout(siteData.about);
    renderSkills(siteData.skills);
    renderExperience(siteData.experience);
    renderEducation(siteData.education);
    renderServices(siteData.services);
    renderProjects(siteData.projects);
        renderPosts(siteData.posts);
    renderTestimonials(siteData.testimonials);
    renderContact(siteData.profile, siteData.config);
    applySectionVisibility(siteData.config);
    initRevealAnimations();
  } catch (e) {
    console.error('Failed to load site data:', e);
    document.getElementById('projects-list').innerHTML =
      '<p class="empty" style="grid-column: 1/-1;">Failed to load content.</p>';
  }
}

function closeNav() {
  document.getElementById('nav-links').classList.remove('open');
}

// ---------- THEME ----------
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀' : '☾';
    btn.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// ---------- SCROLL PROGRESS + NAV BG ----------
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  const nav = document.querySelector('nav');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = scrolled + '%';
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

// ---------- BACK TO TOP ----------
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
}

// ---------- SCROLL SPY ----------
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id^="section-"], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
}

// ---------- SMOOTH SCROLL ----------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.offsetTop - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ---------- REVEAL ----------
function initRevealAnimations() {
  document.querySelectorAll('.reveal').forEach(el => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  });
}

// ---------- CONFIG ----------
function renderConfig(config) {
  if (!config) return;
  if (config.site_title) document.title = config.site_title;

  if (config.meta_description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = config.meta_description;
  }

  setMetaProperty('og:title', config.site_title || 'Portfolio');
  setMetaProperty('og:description', config.meta_description || '');
  setMetaProperty('og:type', 'website');
  setMetaProperty('twitter:card', 'summary_large_image');

  if (config.accent_color) applyAccent(config.accent_color, config.accent_color_2);

  if (config.footer_text) {
    const ft = document.getElementById('footer-text');
    if (ft) ft.textContent = config.footer_text;
  }

  // Wave 2 — availability badge
  if (config.available_for_work === 1) {
    const badge = document.getElementById('availability-badge');
    const text = document.getElementById('availability-text');
    if (badge && text) {
      text.textContent = config.availability_text || 'Available for work';
      badge.style.display = 'inline-flex';
    }
  }

  // Wave 3.1 — Resume button in nav
  if (config.resume_url) {
    const li = document.getElementById('nav-resume');
    const link = document.getElementById('nav-resume-link');
    if (li && link) {
      link.href = config.resume_url;
      li.style.display = '';
    }
  }

  // Wave 3.1b — Floating resume button
  if (config.resume_url) {
    initFloatingResume(config.resume_url);
  }

  // Wave 4.3 — JSON-LD structured data
  injectJsonLd(config);
}

function setMetaProperty(property, content) {
  if (!content) return;
  const attr = property.startsWith('og:') || property.startsWith('twitter:') ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function applySectionVisibility(config) {
  if (!config || !config.sections_visible) return;
  let visible;
  try { visible = JSON.parse(config.sections_visible); } catch { return; }
  Object.entries(visible).forEach(([key, show]) => {
    const el = document.getElementById('section-' + key);
    if (el && !show) el.classList.add('hidden');
    const nav = document.getElementById('nav-link-' + key);
    if (nav && !show) nav.classList.add('hidden');
  });
}

// ---------- JSON-LD (SEO) ----------
function injectJsonLd(config) {
  if (!config) return;

  const profile = (window.siteData && window.siteData.profile) || {};
  const projects = (window.siteData && window.siteData.projects) || [];
  const origin = location.origin;

  document.querySelectorAll('script[type="application/ld+json"].dynamic-seo').forEach(s => s.remove());

  // Person
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": origin + "#person",
    "name": profile.name || config.site_title || 'Portfolio',
    "url": origin,
    "jobTitle": profile.headline || undefined,
    "description": profile.bio || config.meta_description || undefined,
    "image": profile.avatar_url || undefined,
  };

  if (profile.social_links && profile.social_links !== 'null') {
    try {
      const links = JSON.parse(profile.social_links);
      const sameAs = Object.values(links)
        .filter(v => typeof v === 'string' && v.startsWith('http'));
      if (sameAs.length) person.sameAs = sameAs;
    } catch {}
  }

  // WebSite
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": origin + "#website",
    "url": origin,
    "name": config.site_title || profile.name || 'Portfolio',
    "description": config.meta_description || profile.bio || undefined,
    "author": { "@id": origin + "#person" },
  };

  [person, website].forEach(obj => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.className = 'dynamic-seo';
    script.textContent = JSON.stringify(obj);
    document.head.appendChild(script);
  });

  // Projects as ItemList
  if (projects.length) {
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Projects",
      "itemListElement": projects.slice(0, 20).map((p, i) => {
        let tags = [];
        try { tags = JSON.parse(p.tags || '[]'); } catch {}
        return {
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "CreativeWork",
            "name": p.title,
            "description": p.description || undefined,
            "image": p.image_url || undefined,
            "url": p.live_url || (origin + '/#project-' + p.id),
            "keywords": tags.length ? tags.join(', ') : undefined,
          },
        };
      }),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.className = 'dynamic-seo';
    script.textContent = JSON.stringify(itemList);
    document.head.appendChild(script);
  }
}

// ---------- PROFILE ----------
function renderProfile(p) {
  if (!p) return;
  const name = p.name || 'Your Name';
  document.getElementById('nav-name').textContent = name;
  document.getElementById('footer-name').textContent = name;
  document.getElementById('name').textContent = name;

  const headline = document.getElementById('headline');
  if (p.headline) headline.textContent = p.headline;
  else headline.remove();

  const bio = document.getElementById('bio');
  if (p.bio && p.bio.trim() && p.bio.trim() !== 'sdsdsd') bio.textContent = p.bio;
  else bio.remove();

  if (p.avatar_url) {
    const avatar = document.getElementById('avatar');
    avatar.src = p.avatar_url;
    avatar.alt = name;
    avatar.classList.add('show');
  }

  let covers = [];
  if (p.cover_images && p.cover_images !== 'null') {
    try { covers = JSON.parse(p.cover_images); } catch {}
  }
  initCarousel(covers);

  if (p.social_links && p.social_links !== 'null') {
    let links = {};
    try { links = JSON.parse(p.social_links); } catch {}
    const labels = {
      github: 'GitHub', twitter: 'Twitter', x: 'X',
      linkedin: 'LinkedIn', email: 'Email',
      youtube: 'YouTube', instagram: 'Instagram',
      website: 'Website', facebook: 'Facebook'
    };
    document.getElementById('socials').innerHTML = Object.entries(links)
      .filter(([_, url]) => url)
      .map(([key, url]) => {
        const isEmail = key === 'email';
        const href = isEmail ? '#' : url;
        const extra = isEmail ? `onclick="copyEmail(event, '${escapeHtml(url)}')"` : 'target="_blank" rel="noopener"';
        const cls = isEmail ? 'email-copy' : '';
        const label = labels[key.toLowerCase()] || key;
        return `<a href="${escapeHtml(href)}" ${extra} class="${cls}">${escapeHtml(label)}</a>`;
      }).join('');
  }
}

function copyEmail(e, email) {
  e.preventDefault();
  const el = e.currentTarget;

  const done = () => {
    el.classList.add('copied');
    el.setAttribute('aria-label', 'Email copied');

    if (el._copyTimer) clearTimeout(el._copyTimer);
    el._copyTimer = setTimeout(() => {
      el.classList.remove('copied');
      el.removeAttribute('aria-label');
      el._copyTimer = null;
    }, 1800);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(email).then(done).catch(() => {
      legacyCopy(email);
      done();
    });
  } else {
    legacyCopy(email);
    done();
  }
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

// ---------- FLOATING RESUME ----------
function initFloatingResume(url) {
  const btn = document.getElementById('floating-resume');
  if (!btn) return;

  btn.href = url;
  btn.style.display = 'flex';

  positionFloatingResume(btn);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => positionFloatingResume(btn), 200);
  }, { passive: true });
}

function positionFloatingResume(btn) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const btnSize = 56;
  const margin = 20;
  const reservedTop = 80;

  const positions = [
    { top: reservedTop, left: margin },
    { top: 'middle',    left: margin },
    { top: h - btnSize - margin - 100, left: margin },

    { top: reservedTop, left: w - btnSize - margin },
    { top: 'middle',    left: w - btnSize - margin },
    { top: h - btnSize - margin - 100, left: w - btnSize - margin },

    { top: reservedTop, left: 'center' },
    { top: h - btnSize - margin - 20, left: 'center' },
  ];

  const last = sessionStorage.getItem('floating_resume_pos');
  let idx = Math.floor(Math.random() * positions.length);
  if (String(idx) === last && positions.length > 1) {
    idx = (idx + 1) % positions.length;
  }
  sessionStorage.setItem('floating_resume_pos', String(idx));

  const pos = positions[idx];

  btn.style.top = '';
  btn.style.bottom = '';
  btn.style.left = '';
  btn.style.right = '';
  btn.style.transform = '';

  if (pos.top === 'middle') {
    btn.style.top = '50%';
    btn.style.transform = 'translateY(-50%)';
  } else {
    btn.style.top = pos.top + 'px';
  }

  if (pos.left === 'center') {
    btn.style.left = '50%';
    btn.style.transform = (btn.style.transform || '') + ' translateX(-50%)';
  } else {
    btn.style.left = pos.left + 'px';
  }

  btn.classList.remove('pop');
  void btn.offsetWidth;
  btn.classList.add('pop');
}

// ---------- CAROUSEL ----------
function initCarousel(covers) {
  const track = document.getElementById('carousel-track');
  const dotsEl = document.getElementById('carousel-dots');

  let slides = [];
  if (covers && covers.length) {
    slides = covers;
  } else {
    slides = ['gradient-1', 'gradient-2', 'gradient-3'];
  }

  carouselState.total = slides.length;
  carouselState.current = 0;

  track.innerHTML = slides.map(src => {
    if (src.startsWith('gradient-')) {
      return `<div class="carousel-slide ${src}"></div>`;
    }
    return `<div class="carousel-slide" style="background-image: url('${escapeHtml(src)}');"></div>`;
  }).join('');

  dotsEl.innerHTML = slides.map((_, i) =>
    `<button class="carousel-dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})" aria-label="Slide ${i + 1}"></button>`
  ).join('');

  track.style.transform = 'translateX(0%)';
  startCarouselTimer();
  initCarouselHover();
  initCarouselSwipe();
}

function goToSlide(i) {
  carouselState.current = (i + carouselState.total) % carouselState.total;
  updateCarousel();
  resetCarouselTimer();
}

function nextSlide() { goToSlide(carouselState.current + 1); }
function prevSlide() { goToSlide(carouselState.current - 1); }

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  track.style.transform = `translateX(-${carouselState.current * 100}%)`;
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === carouselState.current);
  });
}

function startCarouselTimer() {
  stopCarouselTimer();
  if (carouselState.total <= 1) return;
  carouselState.timer = setInterval(() => {
    if (!carouselState.paused) nextSlide();
  }, 5000);
}

function stopCarouselTimer() {
  if (carouselState.timer) clearInterval(carouselState.timer);
  carouselState.timer = null;
}

function resetCarouselTimer() {
  startCarouselTimer();
}

function initCarouselHover() {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  carousel.addEventListener('mouseenter', () => carouselState.paused = true);
  carousel.addEventListener('mouseleave', () => carouselState.paused = false);
}

function initCarouselSwipe() {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  let startX = 0;
  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    carouselState.paused = true;
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
    }
    carouselState.paused = false;
  }, { passive: true });
}

// ---------- ABOUT ----------
function renderAbout(a) {
  if (!a) return;
  const heading = document.getElementById('about-heading');
  const subtitle = document.getElementById('about-subtitle');
  const body = document.getElementById('about-body');
  const stats = document.getElementById('about-stats');

  if (a.heading) heading.textContent = a.heading;
  if (a.subheading) subtitle.textContent = a.subheading;

  if (a.body) {
    body.innerHTML = a.body.split('\n').filter(Boolean)
      .map(p => `<p>${escapeHtml(p)}</p>`).join('');
  } else {
    body.innerHTML = '<p>No content yet.</p>';
  }

  if (a.stats) {
    let statsArr = [];
    try { statsArr = JSON.parse(a.stats); } catch {}
    if (statsArr.length) {
      stats.innerHTML = statsArr.map(s => `
        <div class="stat">
          <div class="stat-number">${escapeHtml(s.number || '')}</div>
          <div class="stat-label">${escapeHtml(s.label || '')}</div>
        </div>
      `).join('');
    } else {
      stats.innerHTML = '';
    }
  }
}

// ---------- SKILLS ----------
function renderSkills(skills) {
  const el = document.getElementById('skills-grid');
  if (!skills || !skills.length) {
    el.innerHTML = '<p class="empty" style="grid-column: 1/-1;">No skills added yet.</p>';
    return;
  }
  el.innerHTML = skills.map(s => {
    let items = [];
    try { items = JSON.parse(s.items); } catch {}
    return `
      <div class="skill-category reveal">
        <h3>${escapeHtml(s.category)}</h3>
        <div class="skill-list">
          ${items.map(i => `<span class="skill-chip">${escapeHtml(i)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ---------- EXPERIENCE ----------
function renderExperience(items) {
  const el = document.getElementById('experience-timeline');
  if (!items || !items.length) {
    el.innerHTML = '<p class="empty">No experience added yet.</p>';
    return;
  }
  el.innerHTML = items.map(e => `
    <div class="timeline-item reveal">
      <div class="timeline-date">${escapeHtml(formatDate(e.start_date))} — ${e.end_date ? escapeHtml(formatDate(e.end_date)) : 'Present'}</div>
      <div class="timeline-title">${escapeHtml(e.role)}</div>
      <div class="timeline-subtitle">${escapeHtml(e.company)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
      ${e.description ? `<div class="timeline-desc">${escapeHtml(e.description)}</div>` : ''}
    </div>
  `).join('');
}

// ---------- EDUCATION ----------
function renderEducation(items) {
  const el = document.getElementById('education-timeline');
  if (!items || !items.length) {
    el.innerHTML = '<p class="empty">No education added yet.</p>';
    return;
  }
  el.innerHTML = items.map(e => `
    <div class="timeline-item reveal">
      <div class="timeline-date">${escapeHtml(formatDate(e.start_date))} — ${e.end_date ? escapeHtml(formatDate(e.end_date)) : 'Present'}</div>
      <div class="timeline-title">${escapeHtml(e.degree)}</div>
      <div class="timeline-subtitle">${escapeHtml(e.institution)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
      ${e.description ? `<div class="timeline-desc">${escapeHtml(e.description)}</div>` : ''}
    </div>
  `).join('');
}

// ---------- SERVICES ----------
function renderServices(items) {
  const el = document.getElementById('services-grid');
  if (!items || !items.length) {
    el.innerHTML = '<p class="empty" style="grid-column: 1/-1;">No services added yet.</p>';
    return;
  }
  el.innerHTML = items.map(s => `
    <div class="service-card reveal">
      ${s.icon ? `<span class="service-icon">${escapeHtml(s.icon)}</span>` : ''}
      <h3>${escapeHtml(s.title)}</h3>
      ${s.description ? `<p>${escapeHtml(s.description)}</p>` : ''}
    </div>
  `).join('');
}

// ---------- PROJECTS ----------
function renderProjects(items) {
  const el = document.getElementById('projects-list');
  const filterEl = document.getElementById('project-filter');

  if (!items || !items.length) {
    el.innerHTML = '<p class="empty" style="grid-column: 1/-1;">No projects yet. Check back soon.</p>';
    filterEl.style.display = 'none';
    return;
  }

  // Store for modal lookup
  window._projects = items;

  const tagSet = new Set();
  items.forEach(p => {
    let tags = [];
    try { tags = JSON.parse(p.tags || '[]'); } catch {}
    tags.forEach(t => tagSet.add(t));
  });
  const allTags = [...tagSet].sort((a, b) => a.localeCompare(b));

  projectFilter.allTags = allTags;
  projectFilter.active = 'all';

  if (allTags.length >= 2) {
    filterEl.style.display = 'flex';
    filterEl.innerHTML =
      `<button class="filter-chip active" data-tag="all" onclick="filterProjects('all')">All</button>` +
      allTags.map(t =>
        `<button class="filter-chip" data-tag="${escapeHtml(t)}" onclick="filterProjects('${escapeHtml(t).replace(/'/g, "\\'")}')">${escapeHtml(t)}</button>`
      ).join('');
  } else {
    filterEl.style.display = 'none';
  }

  el.innerHTML = items.map((p, i) => {
    let tags = [];
    try { tags = JSON.parse(p.tags || '[]'); } catch {}

    const imgWrap = p.image_url
      ? `<div class="project-image-wrap"><img class="project-image" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy" /></div>`
      : '';

    const live = p.live_url
      ? `<a href="${escapeHtml(p.live_url)}" target="_blank" rel="noopener">Live Demo →</a>` : '';
    const repo = p.repo_url
      ? `<a href="${escapeHtml(p.repo_url)}" target="_blank" rel="noopener">Source Code →</a>` : '';

    return `
      <article class="project reveal" data-tags="${escapeHtml(tags.join(','))}" data-project-id="${p.id}" onclick="openProjectModal(${p.id})" style="transition-delay:${i * 50}ms; cursor: pointer;">
        ${imgWrap}
        <div class="project-body">
          <h3>${escapeHtml(p.title)}</h3>
          ${p.description ? `<p>${escapeHtml(p.description)}</p>` : '<p></p>'}
          ${tags.length ? `<div class="tags">${tags.map(t => `<span class="tag" onclick="event.stopPropagation(); filterProjects('${escapeHtml(t).replace(/'/g, "\\'")}')">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          ${(live || repo) ? `<div class="links" onclick="event.stopPropagation();">${live}${repo}</div>` : ''}
        </div>
      </article>
    `;
  }).join('');

  initRevealAnimations();
}

// ---------- BLOG POSTS ----------
function renderPosts(posts) {
  const el = document.getElementById('posts-list');
  if (!el) return;

  if (!posts || !posts.length) {
    el.innerHTML = '<p class="empty" style="grid-column: 1/-1;">No posts yet. Check back soon.</p>';
    return;
  }

  el.innerHTML = posts.map((p, i) => {
    let tags = [];
    try { tags = JSON.parse(p.tags || '[]'); } catch {}

    const cover = p.cover_image
      ? `<div class="project-image-wrap"><img class="project-image" src="${escapeHtml(p.cover_image)}" alt="${escapeHtml(p.title)}" loading="lazy" /></div>`
      : '';

    const date = p.published_at
      ? `<div class="post-date">${formatPostDate(p.published_at)}</div>`
      : '';

    return `
      <article class="post-card reveal" onclick="openPostView('${escapeHtml(p.slug)}')" style="transition-delay:${i * 50}ms; cursor: pointer;">
        ${cover}
        <div class="project-body">
          ${date}
          <h3>${escapeHtml(p.title)}</h3>
          ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : '<p></p>'}
          ${tags.length ? `<div class="tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          <div class="post-read-more">Read more →</div>
        </div>
      </article>
    `;
  }).join('');

  initRevealAnimations();
}

function formatPostDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}

// ---------- POST VIEW ----------
function openPostView(slug) {
  const posts = (window.siteData && window.siteData.posts) || [];
  const post = posts.find(p => p.slug === slug);
  if (!post) return;

  const overlay = document.getElementById('post-modal-overlay');
  const imageEl = document.getElementById('post-view-image');
  const dateEl = document.getElementById('post-view-date');
  const titleEl = document.getElementById('post-view-title');
  const tagsEl = document.getElementById('post-view-tags');
  const contentEl = document.getElementById('post-view-content');

  if (!overlay) return;

  if (post.cover_image) {
    imageEl.style.display = 'block';
    imageEl.innerHTML = `<img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" />`;
  } else {
    imageEl.style.display = 'none';
    imageEl.innerHTML = '';
  }

  dateEl.textContent = formatPostDate(post.published_at);
  titleEl.textContent = post.title;

  let tags = [];
  try { tags = JSON.parse(post.tags || '[]'); } catch {}
  if (tags.length) {
    tagsEl.style.display = 'flex';
    tagsEl.innerHTML = tags.map(t => `<span class="project-modal-tag">${escapeHtml(t)}</span>`).join('');
  } else {
    tagsEl.style.display = 'none';
    tagsEl.innerHTML = '';
  }

  if (post.content) {
    contentEl.innerHTML = post.content
      .split('\n')
      .filter(Boolean)
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('');
  } else {
    contentEl.innerHTML = '<p class="text-muted">No content.</p>';
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', location.pathname + location.search + '#post-' + slug);
}

function closePostView() {
  const overlay = document.getElementById('post-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search + '#section-blog');
}

function closePostViewFromOverlay(e) {
  if (e.target.id === 'post-modal-overlay') {
    closePostView();
  }
}

// Deep link: open post if URL contains #post-<slug>
function checkPostHash() {
  const hash = location.hash;
  if (hash && hash.startsWith('#post-')) {
    const slug = hash.replace('#post-', '');
    setTimeout(() => openPostView(slug), 300);
  }
}

document.addEventListener('DOMContentLoaded', checkPostHash);
window.addEventListener('hashchange', checkPostHash);

// ---------- FILTER ----------
function filterProjects(tag) {
  projectFilter.active = tag;

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.tag === tag);
  });

  const projects = document.querySelectorAll('#projects-list .project');
  let visibleCount = 0;

  projects.forEach(card => {
    const cardTags = (card.dataset.tags || '').split(',').filter(Boolean);
    const matches = tag === 'all' || cardTags.includes(tag);

    if (matches) {
      card.style.display = '';
      visibleCount++;
      card.classList.remove('revealed');
      requestAnimationFrame(() => card.classList.add('revealed'));
    } else {
      card.style.display = 'none';
    }
  });

  const el = document.getElementById('projects-list');
  const existing = el.querySelector('.filter-empty');
  if (visibleCount === 0) {
    if (!existing) {
      const msg = document.createElement('p');
      msg.className = 'empty filter-empty';
      msg.style.gridColumn = '1 / -1';
      msg.textContent = `No projects tagged "${tag}".`;
      el.appendChild(msg);
    }
  } else if (existing) {
    existing.remove();
  }

  history.replaceState(null, '', location.pathname + location.search + '#section-projects');
}

// ---------- PROJECT MODAL ----------
function openProjectModal(id) {
  const projects = window._projects || [];
  const project = projects.find(p => String(p.id) === String(id));
  if (!project) return;

  const overlay = document.getElementById('project-modal-overlay');
  const imageEl = document.getElementById('project-modal-image');
  const titleEl = document.getElementById('project-modal-title');
  const tagsEl = document.getElementById('project-modal-tags');
  const descEl = document.getElementById('project-modal-desc');
  const linksEl = document.getElementById('project-modal-links');

  if (!overlay) return;

  if (project.image_url) {
    imageEl.style.display = 'block';
    imageEl.innerHTML = `<img src="${escapeHtml(project.image_url)}" alt="${escapeHtml(project.title)}" />`;
  } else {
    imageEl.style.display = 'none';
    imageEl.innerHTML = '';
  }

  titleEl.textContent = project.title;

  let tags = [];
  try { tags = JSON.parse(project.tags || '[]'); } catch {}
  if (tags.length) {
    tagsEl.style.display = 'flex';
    tagsEl.innerHTML = tags.map(t => `<span class="project-modal-tag">${escapeHtml(t)}</span>`).join('');
  } else {
    tagsEl.style.display = 'none';
    tagsEl.innerHTML = '';
  }

  if (project.description) {
    descEl.innerHTML = project.description
      .split('\n')
      .filter(Boolean)
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('');
  } else {
    descEl.innerHTML = '<p class="text-muted">No description provided.</p>';
  }

  const links = [];
  if (project.live_url) {
    links.push(`<a href="${escapeHtml(project.live_url)}" target="_blank" rel="noopener" class="btn btn-primary">Visit Live →</a>`);
  }
  if (project.repo_url) {
    links.push(`<a href="${escapeHtml(project.repo_url)}" target="_blank" rel="noopener" class="btn btn-secondary">View Code →</a>`);
  }
  linksEl.innerHTML = links.join('');

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  history.replaceState(null, '', location.pathname + location.search + '#project-' + id);
}

function closeProjectModal() {
  const overlay = document.getElementById('project-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search + '#section-projects');
}

function closeProjectModalFromOverlay(e) {
  if (e.target.id === 'project-modal-overlay') {
    closeProjectModal();
  }
}

function checkProjectHash() {
  const hash = location.hash;
  if (hash && hash.startsWith('#project-')) {
    const id = hash.replace('#project-', '');
    setTimeout(() => openProjectModal(id), 300);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const projectOverlay = document.getElementById('project-modal-overlay');
    if (projectOverlay && projectOverlay.classList.contains('active')) {
      closeProjectModal();
      return;
    }
    const postOverlay = document.getElementById('post-modal-overlay');
    if (postOverlay && postOverlay.classList.contains('active')) {
      closePostView();
    }
  }
});

document.addEventListener('DOMContentLoaded', checkProjectHash);
window.addEventListener('hashchange', checkProjectHash);

// ---------- TESTIMONIALS ----------
function renderTestimonials(items) {
  const carouselEl = document.getElementById('testimonials-carousel');
  const gridEl = document.getElementById('testimonials-grid');

  if (!items || !items.length) {
    carouselEl.style.display = 'none';
    gridEl.style.display = 'block';
    gridEl.innerHTML = '<p class="empty" style="grid-column: 1/-1;">No testimonials yet.</p>';
    return;
  }

  if (items.length < 3) {
    carouselEl.style.display = 'none';
    gridEl.style.display = 'grid';
    gridEl.innerHTML = items.map(renderTestimonialCard).join('');
    return;
  }

  gridEl.style.display = 'none';
  carouselEl.style.display = 'block';

  testimonialsState.total = items.length;
  testimonialsState.current = 0;

  const track = document.getElementById('tcar-track');
  const dotsEl = document.getElementById('tcar-dots');

  track.innerHTML = items.map(renderTestimonialSlide).join('');

  dotsEl.innerHTML = items.map((_, i) =>
    `<button class="tcar-dot${i === 0 ? ' active' : ''}" onclick="goToTestimonial(${i})" aria-label="Go to testimonial ${i + 1}"></button>`
  ).join('');

  track.style.transform = 'translateX(0%)';
  startTestimonialsTimer();
  initTestimonialsHover();
  initTestimonialsSwipe();
}

function renderTestimonialCard(t) {
  return `
    <div class="testimonial-card reveal">
      <div class="testimonial-quote">${escapeHtml(t.quote)}</div>
      <div class="testimonial-author">
        ${t.avatar_url ? `<img class="testimonial-avatar" src="${escapeHtml(t.avatar_url)}" alt="${escapeHtml(t.author)}" loading="lazy" />` : ''}
        <div>
          <div class="testimonial-author-name">${escapeHtml(t.author)}</div>
          ${t.role ? `<div class="testimonial-author-role">${escapeHtml(t.role)}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderTestimonialSlide(t) {
  return `
    <div class="tcar-slide">
      <div class="tcar-slide-inner">
        <div class="testimonial-quote">${escapeHtml(t.quote)}</div>
        <div class="testimonial-author">
          ${t.avatar_url ? `<img class="testimonial-avatar" src="${escapeHtml(t.avatar_url)}" alt="${escapeHtml(t.author)}" loading="lazy" />` : ''}
          <div>
            <div class="testimonial-author-name">${escapeHtml(t.author)}</div>
            ${t.role ? `<div class="testimonial-author-role">${escapeHtml(t.role)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function goToTestimonial(i) {
  testimonialsState.current = (i + testimonialsState.total) % testimonialsState.total;
  updateTestimonials();
  resetTestimonialsTimer();
}

function nextTestimonial() { goToTestimonial(testimonialsState.current + 1); }
function prevTestimonial() { goToTestimonial(testimonialsState.current - 1); }

function updateTestimonials() {
  const track = document.getElementById('tcar-track');
  track.style.transform = `translateX(-${testimonialsState.current * 100}%)`;
  document.querySelectorAll('.tcar-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === testimonialsState.current);
  });
}

function startTestimonialsTimer() {
  stopTestimonialsTimer();
  if (testimonialsState.total <= 1) return;
  testimonialsState.timer = setInterval(() => {
    if (!testimonialsState.paused) nextTestimonial();
  }, 6000);
}

function stopTestimonialsTimer() {
  if (testimonialsState.timer) clearInterval(testimonialsState.timer);
  testimonialsState.timer = null;
}

function resetTestimonialsTimer() {
  startTestimonialsTimer();
}

function initTestimonialsHover() {
  const carousel = document.getElementById('testimonials-carousel');
  if (!carousel) return;
  carousel.addEventListener('mouseenter', () => testimonialsState.paused = true);
  carousel.addEventListener('mouseleave', () => testimonialsState.paused = false);
}

function initTestimonialsSwipe() {
  const carousel = document.getElementById('testimonials-carousel');
  if (!carousel) return;
  let startX = 0;
  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    testimonialsState.paused = true;
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextTestimonial() : prevTestimonial();
    }
    testimonialsState.paused = false;
  }, { passive: true });
}

// ---------- CONTACT ----------
function renderContact(profile, config) {
  const el = document.getElementById('contact-actions');
  let links = {};
  if (profile?.social_links && profile.social_links !== 'null') {
    try { links = JSON.parse(profile.social_links); } catch {}
  }

  const buttons = [];
  const email = config?.contact_email || links.email;
  if (email) {
    buttons.push(`<a href="mailto:${escapeHtml(email)}" class="btn btn-primary">Send Email</a>`);
  }
  if (links.github) {
    buttons.push(`<a href="${escapeHtml(links.github)}" target="_blank" rel="noopener" class="btn btn-secondary">GitHub</a>`);
  }
  if (links.linkedin) {
    buttons.push(`<a href="${escapeHtml(links.linkedin)}" target="_blank" rel="noopener" class="btn btn-secondary">LinkedIn</a>`);
  }
  if (config?.resume_url) {
    buttons.push(`<a href="${escapeHtml(config.resume_url)}" target="_blank" rel="noopener" class="btn btn-secondary">📄 Resume</a>`);
  }
  if (buttons.length) el.innerHTML = buttons.join('');
}

// ---------- CONTACT FORM ----------
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById('form-status');
  const btn = form.querySelector('button[type="submit"]');

  form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('input, textarea').forEach(el => el.classList.remove('input-error'));

  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim(),
  };

  let hasError = false;

  if (!data.name) {
    setFieldError('err-name', 'Please enter your name');
    form.name.classList.add('input-error');
    hasError = true;
  }
  if (!data.email) {
    setFieldError('err-email', 'Please enter your email');
    form.email.classList.add('input-error');
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    setFieldError('err-email', 'Please enter a valid email');
    form.email.classList.add('input-error');
    hasError = true;
  }
  if (!data.message) {
    setFieldError('err-message', 'Please enter a message');
    form.message.classList.add('input-error');
    hasError = true;
  }

  if (hasError) {
    status.textContent = 'Please fix the errors above';
    status.className = 'form-status error';
    return;
  }

  btn.disabled = true;
  status.textContent = 'Sending...';
  status.className = 'form-status';

  try {
    await apiSend('/contact', 'POST', data);
    status.textContent = '✓ Message sent! I will get back to you soon.';
    status.className = 'form-status success';
    form.reset();
    setTimeout(() => {
      status.textContent = '';
      status.className = 'form-status';
    }, 6000);
  } catch (err) {
    status.textContent = '✗ Failed to send. Please try again.';
    status.className = 'form-status error';
  } finally {
    btn.disabled = false;
  }
}

function setFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// ---------- HELPERS ----------
function formatDate(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  if (!m) return y;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1] || ''} ${y}`;
}

// ============================================
// WAVE 5.4 — CUSTOM CURSOR
// ============================================

function initCustomCursor() {
  // Skip on mobile / touch devices
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFinePointer || prefersReducedMotion) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const trail = document.getElementById('cursor-trail');
  if (!dot || !ring || !trail) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my;   // ring
  let tx = mx, ty = my;   // trail
  let raf = null;

  // Instant position for dot, plus start the animation loop
  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;

    // Dot is instant
    dot.style.transform =
      `translate(${mx}px, ${my}px) translate(-50%, -50%)`;

    document.body.classList.remove('cursor-hidden');

    // Start loop only if not already running
    if (!raf) raf = requestAnimationFrame(animate);
  }

  // Smooth follow with different speeds for ring and trail
  function animate() {
    // Ring — fast follow (0.35 lerp)
    rx += (mx - rx) * 0.35;
    ry += (my - ry) * 0.35;

    // Trail — slower follow (0.12 lerp) for a nice trailing effect
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;

    ring.style.transform =
      `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    trail.style.transform =
      `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;

    // Stop the loop if we're close enough (saves CPU)
    if (
      Math.abs(mx - rx) < 0.1 &&
      Math.abs(my - ry) < 0.1 &&
      Math.abs(mx - tx) < 0.1 &&
      Math.abs(my - ty) < 0.1
    ) {
      raf = null;
      return;
    }

    raf = requestAnimationFrame(animate);
  }

  // Fast hover detection using event delegation
  const interactives =
    'a, button, [onclick], input, textarea, .project, .post-card, .tag, .filter-chip, .carousel-dot, .tcar-dot, .socials a';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(interactives)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(interactives)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  // Click feedback
  document.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-click');
  });
  document.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-click');
  });

  // Window leave/enter
  document.addEventListener('mouseleave', () => {
    document.body.classList.add('cursor-hidden');
  });
  document.addEventListener('mouseenter', () => {
    document.body.classList.remove('cursor-hidden');
  });

  // Track mouse movement
  document.addEventListener('mousemove', onMove, { passive: true });

  // Kick off the animation loop once
  raf = requestAnimationFrame(animate);
}

// Init cursor when DOM is ready
document.addEventListener('DOMContentLoaded', initCustomCursor);

// ============================================
// PARTICLE NETWORK BACKGROUND
// ============================================

function initParticleNetwork() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');

  // ---------- CONFIG ----------
  const CONFIG = {
    particleDensity: 0.00012,   // particles per pixel² (smaller = fewer)
    maxParticles: 90,           // hard cap so it never gets crazy
    minParticles: 30,
    maxLinkDist: 130,           // how far apart particles can be and still link
    particleSpeed: 0.35,        // base speed (px per frame)
    particleRadius: 1.6,        // dot size
    particleColorDark: 'rgba(56, 189, 248, 0.75)',
    particleColorLight: 'rgba(14, 116, 144, 0.9)',   // darker cyan for white bg
    lineColorDark: 'rgba(56, 189, 248, 0.18)',
    lineColorLight: 'rgba(14, 116, 144, 0.35)',
    mouseInfluenceDist: 160,    // cursor attraction radius
    mouseInfluenceForce: 0.02,
    clickRadius: 200,
    clickForce: 6,
    clickFlashDuration: 500,
    clickBrightnessBoost: 1.8,  // how strongly particles drift toward cursor
  };

  let particles = [];
  let flashes = [];       // active click flashes
  let clickPulse = 0;     // 0 = no boost, 1 = max boost (decays over time)
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let mouseX = -9999;
  let mouseY = -9999;
  let rafId = null;
  let visible = true;

  // ---------- RESIZE ----------
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Recompute particle count based on screen area
    const target = Math.min(
      CONFIG.maxParticles,
      Math.max(CONFIG.minParticles, Math.floor(width * height * CONFIG.particleDensity))
    );

    if (particles.length < target) {
      for (let i = particles.length; i < target; i++) {
        particles.push(makeParticle());
      }
    } else if (particles.length > target) {
      particles.length = target;
    }
  }

  // ---------- PARTICLE ----------
  function makeParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = CONFIG.particleSpeed * (0.5 + Math.random() * 0.8);
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: CONFIG.particleRadius * (0.7 + Math.random() * 0.8),
    };
  }

  // ---------- DRAW LOOP ----------
    function draw() {
    if (!visible) {
      rafId = null;
      return;
    }

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const particleColor = isLight ? CONFIG.particleColorLight : CONFIG.particleColorDark;
    const lineColor = isLight ? CONFIG.lineColorLight : CONFIG.lineColorDark;

    // Decay click pulse — reduces 0.06 per frame (~16 frames to 0)
    clickPulse = Math.max(0, clickPulse - 0.06);
    const boost = 1 + clickPulse * (CONFIG.clickBrightnessBoost - 1);

    ctx.clearRect(0, 0, width, height);

    // Update positions
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse attraction — subtle drift toward cursor
      if (mouseX > -999) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distSq = dx * dx + dy * dy;
        const maxDist = CONFIG.mouseInfluenceDist;
        if (distSq < maxDist * maxDist) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (1 - dist / maxDist) * CONFIG.mouseInfluenceForce;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Cap velocity so particles don't run away
      const maxV = CONFIG.particleSpeed * 2;
      const v = Math.hypot(p.vx, p.vy);
      if (v > maxV) {
        p.vx = (p.vx / v) * maxV;
        p.vy = (p.vy / v) * maxV;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap or bounce at edges — bounce feels more "alive"
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > width) { p.x = width; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > height) { p.y = height; p.vy *= -1; }
    }

    // Draw links first (below dots)
    ctx.lineWidth = 1;
    const maxDist = CONFIG.maxLinkDist;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          const alpha = 1 - distSq / maxDistSq;
          ctx.globalAlpha = alpha * boost;
          ctx.strokeStyle = lineColor;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Draw particles
        // Draw particles (with brightness boost)
    ctx.fillStyle = particleColor;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = Math.min(1, boost);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw click flashes (expanding rings)
    const now = performance.now();
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      const elapsed = now - f.start;
      const t = elapsed / f.duration;
      if (t >= 1) {
        flashes.splice(i, 1);
        continue;
      }
      const radius = f.maxR * t;
      const alpha = (1 - t) * (isLight ? 0.5 : 0.85);

      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight
        ? `rgba(14, 116, 144, ${alpha})`
        : `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 2 * (1 - t);
      ctx.stroke();

      // Second inner ring for a "double pulse" effect
      const radius2 = radius * 0.55;
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius2, 0, Math.PI * 2);
      ctx.strokeStyle = isLight
        ? `rgba(168, 85, 247, ${alpha * 0.6})`
        : `rgba(168, 85, 247, ${alpha * 0.6})`;
      ctx.lineWidth = 1.5 * (1 - t);
      ctx.stroke();
    }

    rafId = requestAnimationFrame(draw);
  }

  // ---------- START / STOP ----------
  function start() {
    if (rafId === null) rafId = requestAnimationFrame(draw);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // ---------- EVENTS ----------
  window.addEventListener('resize', () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resize();
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  // Pause when the tab is hidden (save CPU)
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  });

    // ---------- CLICK EFFECT ----------
  function spawnClick(x, y) {
    // 1. Push nearby particles outward
    const R = CONFIG.clickRadius;
    const R2 = R * R;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < R2 && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        // Force falls off with distance
        const force = (1 - dist / R) * CONFIG.clickForce;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }

    // 2. Add a flash
    flashes.push({
      x, y,
      start: performance.now(),
      duration: CONFIG.clickFlashDuration,
      maxR: R,
    });

    // 3. Trigger brightness pulse (decays in draw loop)
    clickPulse = 1;
  }

  function onCanvasClick(e) {
    // Only left click (or tap)
    if (e.button !== undefined && e.button !== 0) return;
    spawnClick(e.clientX, e.clientY);
  }

  // Capture clicks anywhere on the page (except admin UI)
  document.addEventListener('click', onCanvasClick);
  // Mobile: touchstart for immediate feedback
  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (t) spawnClick(t.clientX, t.clientY);
  }, { passive: true });

  // ---------- INIT ----------


  resize();
  start();
}

document.addEventListener('DOMContentLoaded', initParticleNetwork);