// ============================================
// ADMIN PANEL LOGIC — username/password auth
// ============================================

let token = localStorage.getItem('admin_token') || '';
let currentTab = 'dashboard';

// ---------- AUTH ----------
function authHeaders() {
  return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
}

async function login(e) {
  if (e) e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) return;

  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    token = data.token;
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_username', username);
    showDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
}

async function setupAdmin(e) {
  e.preventDefault();
  const username = document.getElementById('setup-username').value.trim();
  const password = document.getElementById('setup-password').value;
  const confirm = document.getElementById('setup-password-confirm').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  if (password !== confirm) {
    errEl.textContent = 'Passwords do not match';
    errEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/setup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Setup failed');

    // Auto-login
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
    await login();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', headers: authHeaders() });
  } catch {}
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  token = '';
  location.reload();
}

async function checkSession() {
  if (!token) return false;
  try {
    const res = await fetch('/api/me', { headers: authHeaders() });
    return res.ok;
  } catch { return false; }
}

async function changePassword(e) {
  e.preventDefault();
  try {
    await apiSend('/change-password', 'POST', {
      current_password: document.getElementById('cp-current').value,
      new_password: document.getElementById('cp-new').value,
    }, token);
    showToast('Password updated');
    e.target.reset();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---------- INIT ----------
async function init() {
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const setupForm = document.getElementById('setup-form');
  const errEl = document.getElementById('login-error');

  // 1. Validate stored session
  if (token && await checkSession()) {
    showDashboard();
    return;
  }

  // 2. Ask the server if any admin exists
  try {
    const res = await fetch('/api/admin-exists');
    const data = await res.json();

    if (data.exists) {
      loginForm.style.display = 'block';
      setupForm.style.display = 'none';
    } else {
      loginForm.style.display = 'none';
      setupForm.style.display = 'block';
    }
  } catch (err) {
    loginForm.style.display = 'block';
    errEl.textContent = 'Could not reach server. Try refreshing.';
    errEl.style.display = 'block';
  }

  loginScreen.style.display = 'flex';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadMessagesCount();
  switchTab('dashboard');
}

// ---------- TABS ----------
function switchTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${name}"]`)?.classList.add('active');
  document.getElementById('panel-' + name)?.classList.add('active');

  const loaders = {
    dashboard: loadDashboard,
    profile: loadProfile,
    about: loadAbout,
    skills: loadSkills,
    experience: loadExperience,
    education: loadEducation,
    services: loadServices,
    projects: loadProjects,
    testimonials: loadTestimonials,
    blog: loadPosts,
    messages: loadMessages,
    settings: loadSettings,
  };
  if (loaders[name]) loaders[name]();
}

// ---------- DASHBOARD ----------
async function loadDashboard() {
  try {
    const [projects, skills, messages] = await Promise.all([
      fetch('/api/admin/projects', { headers: authHeaders() }).then(r => r.json()),
      fetch('/api/admin/skills', { headers: authHeaders() }).then(r => r.json()),
      fetch('/api/admin/messages', { headers: authHeaders() }).then(r => r.json()),
    ]);
    const unread = messages.filter(m => !m.read).length;

    document.getElementById('dash-projects').textContent = projects.length;
    document.getElementById('dash-skills').textContent = skills.length;
    document.getElementById('dash-messages').textContent = messages.length;
    document.getElementById('dash-unread').textContent = unread;
  } catch (e) {
    showToast('Failed to load dashboard', 'error');
  }
}

// ---------- PROFILE ----------
async function loadProfile() {
  const p = await fetch('/api/profile').then(r => r.json());
  document.getElementById('p-name').value = p.name || '';
  document.getElementById('p-headline').value = p.headline || '';
  document.getElementById('p-bio').value = p.bio || '';
  document.getElementById('p-avatar').value = p.avatar_url || '';
  document.getElementById('p-social').value = (p.social_links && p.social_links !== 'null')
    ? JSON.stringify(JSON.parse(p.social_links), null, 2) : '';

  let covers = [];
  if (p.cover_images && p.cover_images !== 'null') {
    try { covers = JSON.parse(p.cover_images); } catch {}
  }
  document.getElementById('p-covers').value = covers.join('\n');
}

async function saveProfile(e) {
  e.preventDefault();
  let social = {};
  const raw = document.getElementById('p-social').value.trim();
  if (raw) {
    try { social = JSON.parse(raw); }
    catch { return showToast('Social links must be valid JSON', 'error'); }
  }

  const covers = document.getElementById('p-covers').value
    .split('\n').map(s => s.trim()).filter(Boolean);

  try {
    await apiSend('/admin/profile', 'PUT', {
      name: document.getElementById('p-name').value,
      headline: document.getElementById('p-headline').value,
      bio: document.getElementById('p-bio').value,
      avatar_url: document.getElementById('p-avatar').value || null,
      social_links: social,
      cover_images: covers,
    }, token);
    showToast('Profile saved');
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- ABOUT ----------
async function loadAbout() {
  const a = await fetch('/api/about').then(r => r.json());
  document.getElementById('a-heading').value = a?.heading || '';
  document.getElementById('a-subheading').value = a?.subheading || '';
  document.getElementById('a-body').value = a?.body || '';
  const stats = (a?.stats && a.stats !== 'null') ? JSON.parse(a.stats) : [];
  renderStatsEditor(stats);
}

function renderStatsEditor(stats) {
  const wrap = document.getElementById('a-stats-editor');
  wrap.innerHTML = stats.map((s, i) => `
    <div class="form-row" style="margin-bottom:8px;">
      <input type="text" placeholder="Number (e.g. 3+)" value="${escapeHtml(s.number || '')}"
        oninput="updateStat(${i}, 'number', this.value)" />
      <input type="text" placeholder="Label (e.g. Years Coding)" value="${escapeHtml(s.label || '')}"
        oninput="updateStat(${i}, 'label', this.value)" />
    </div>
  `).join('');
  wrap.dataset.stats = JSON.stringify(stats);
}

function addStat() {
  const wrap = document.getElementById('a-stats-editor');
  const stats = JSON.parse(wrap.dataset.stats || '[]');
  stats.push({ number: '', label: '' });
  renderStatsEditor(stats);
}

function updateStat(i, key, value) {
  const wrap = document.getElementById('a-stats-editor');
  const stats = JSON.parse(wrap.dataset.stats || '[]');
  stats[i][key] = value;
  wrap.dataset.stats = JSON.stringify(stats);
}

function removeLastStat() {
  const wrap = document.getElementById('a-stats-editor');
  const stats = JSON.parse(wrap.dataset.stats || '[]');
  stats.pop();
  renderStatsEditor(stats);
}

async function saveAbout(e) {
  e.preventDefault();
  const wrap = document.getElementById('a-stats-editor');
  const stats = JSON.parse(wrap.dataset.stats || '[]');
  try {
    await apiSend('/admin/about', 'PUT', {
      heading: document.getElementById('a-heading').value,
      subheading: document.getElementById('a-subheading').value,
      body: document.getElementById('a-body').value,
      stats,
    }, token);
    showToast('About section saved');
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- SKILLS ----------
async function loadSkills() {
  const items = await fetch('/api/admin/skills', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('skills-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No skill categories yet.</p>';
    return;
  }
  el.innerHTML = items.map(s => {
    let arr = []; try { arr = JSON.parse(s.items); } catch {}
    return `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-title">${escapeHtml(s.category)}${s.visible ? '' : '<span class="badge-hidden">HIDDEN</span>'}</div>
          <div class="list-item-sub">${arr.map(escapeHtml).join(' · ')}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn btn-secondary btn-small" onclick='openSkillModal(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn btn-danger btn-small" onclick="deleteSkill(${s.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function openSkillModal(skill = null) {
  document.getElementById('skill-modal-title').textContent = skill ? 'Edit Skill Category' : 'Add Skill Category';
  document.getElementById('skill-id').value = skill?.id || '';
  document.getElementById('skill-category').value = skill?.category || '';
  let arr = [];
  if (skill?.items) { try { arr = JSON.parse(skill.items); } catch {} }
  document.getElementById('skill-items').value = arr.join(', ');
  document.getElementById('skill-sort').value = skill?.sort_order ?? 0;
  document.getElementById('skill-visible').checked = skill ? skill.visible === 1 : true;
  document.getElementById('skill-modal').classList.add('active');
}

function closeSkillModal() {
  document.getElementById('skill-modal').classList.remove('active');
}

async function saveSkill(e) {
  e.preventDefault();
  const id = document.getElementById('skill-id').value;
  const body = {
    category: document.getElementById('skill-category').value,
    items: document.getElementById('skill-items').value.split(',').map(s => s.trim()).filter(Boolean),
    sort_order: parseInt(document.getElementById('skill-sort').value) || 0,
    visible: document.getElementById('skill-visible').checked,
  };
  try {
    const path = id ? `/admin/skills/${id}` : '/admin/skills';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closeSkillModal();
    showToast(id ? 'Skill updated' : 'Skill added');
    loadSkills();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteSkill(id) {
  if (!confirm('Delete this skill category?')) return;
  try {
    await apiSend(`/admin/skills/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadSkills();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- EXPERIENCE ----------
async function loadExperience() {
  const items = await fetch('/api/admin/experience', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('experience-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No experience yet.</p>';
    return;
  }
  el.innerHTML = items.map(x => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${escapeHtml(x.role)} · ${escapeHtml(x.company)}${x.visible ? '' : '<span class="badge-hidden">HIDDEN</span>'}</div>
        <div class="list-item-sub">${escapeHtml(formatMonth(x.start_date))} — ${x.end_date ? escapeHtml(formatMonth(x.end_date)) : 'Present'}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" onclick='openExpModal(${JSON.stringify(x).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteExp(${x.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openExpModal(x = null) {
  document.getElementById('exp-modal-title').textContent = x ? 'Edit Experience' : 'Add Experience';
  document.getElementById('exp-id').value = x?.id || '';
  document.getElementById('exp-role').value = x?.role || '';
  document.getElementById('exp-company').value = x?.company || '';
  document.getElementById('exp-location').value = x?.location || '';
  document.getElementById('exp-start').value = x?.start_date || '';
  document.getElementById('exp-end').value = x?.end_date || '';
  document.getElementById('exp-description').value = x?.description || '';
  document.getElementById('exp-sort').value = x?.sort_order ?? 0;
  document.getElementById('exp-visible').checked = x ? x.visible === 1 : true;
  document.getElementById('exp-modal').classList.add('active');
}

function closeExpModal() {
  document.getElementById('exp-modal').classList.remove('active');
}

async function saveExp(e) {
  e.preventDefault();
  const id = document.getElementById('exp-id').value;
  const body = {
    role: document.getElementById('exp-role').value,
    company: document.getElementById('exp-company').value,
    location: document.getElementById('exp-location').value || null,
    start_date: document.getElementById('exp-start').value || null,
    end_date: document.getElementById('exp-end').value || null,
    description: document.getElementById('exp-description').value || null,
    sort_order: parseInt(document.getElementById('exp-sort').value) || 0,
    visible: document.getElementById('exp-visible').checked,
  };
  try {
    const path = id ? `/admin/experience/${id}` : '/admin/experience';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closeExpModal();
    showToast(id ? 'Experience updated' : 'Experience added');
    loadExperience();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteExp(id) {
  if (!confirm('Delete this entry?')) return;
  try {
    await apiSend(`/admin/experience/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadExperience();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- EDUCATION ----------
async function loadEducation() {
  const items = await fetch('/api/admin/education', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('education-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No education yet.</p>';
    return;
  }
  el.innerHTML = items.map(x => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${escapeHtml(x.degree)} · ${escapeHtml(x.institution)}${x.visible ? '' : '<span class="badge-hidden">HIDDEN</span>'}</div>
        <div class="list-item-sub">${escapeHtml(formatMonth(x.start_date))} — ${x.end_date ? escapeHtml(formatMonth(x.end_date)) : 'Present'}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" onclick='openEduModal(${JSON.stringify(x).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteEdu(${x.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openEduModal(x = null) {
  document.getElementById('edu-modal-title').textContent = x ? 'Edit Education' : 'Add Education';
  document.getElementById('edu-id').value = x?.id || '';
  document.getElementById('edu-degree').value = x?.degree || '';
  document.getElementById('edu-institution').value = x?.institution || '';
  document.getElementById('edu-location').value = x?.location || '';
  document.getElementById('edu-start').value = x?.start_date || '';
  document.getElementById('edu-end').value = x?.end_date || '';
  document.getElementById('edu-description').value = x?.description || '';
  document.getElementById('edu-sort').value = x?.sort_order ?? 0;
  document.getElementById('edu-visible').checked = x ? x.visible === 1 : true;
  document.getElementById('edu-modal').classList.add('active');
}

function closeEduModal() {
  document.getElementById('edu-modal').classList.remove('active');
}

async function saveEdu(e) {
  e.preventDefault();
  const id = document.getElementById('edu-id').value;
  const body = {
    degree: document.getElementById('edu-degree').value,
    institution: document.getElementById('edu-institution').value,
    location: document.getElementById('edu-location').value || null,
    start_date: document.getElementById('edu-start').value || null,
    end_date: document.getElementById('edu-end').value || null,
    description: document.getElementById('edu-description').value || null,
    sort_order: parseInt(document.getElementById('edu-sort').value) || 0,
    visible: document.getElementById('edu-visible').checked,
  };
  try {
    const path = id ? `/admin/education/${id}` : '/admin/education';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closeEduModal();
    showToast(id ? 'Education updated' : 'Education added');
    loadEducation();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteEdu(id) {
  if (!confirm('Delete this entry?')) return;
  try {
    await apiSend(`/admin/education/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadEducation();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- SERVICES ----------
async function loadServices() {
  const items = await fetch('/api/admin/services', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('services-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No services yet.</p>';
    return;
  }
  el.innerHTML = items.map(s => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${escapeHtml(s.icon || '')} ${escapeHtml(s.title)}${s.visible ? '' : '<span class="badge-hidden">HIDDEN</span>'}</div>
        <div class="list-item-sub">${escapeHtml(s.description || '')}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" onclick='openSvcModal(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteSvc(${s.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openSvcModal(s = null) {
  document.getElementById('svc-modal-title').textContent = s ? 'Edit Service' : 'Add Service';
  document.getElementById('svc-id').value = s?.id || '';
  document.getElementById('svc-icon').value = s?.icon || '';
  document.getElementById('svc-title').value = s?.title || '';
  document.getElementById('svc-description').value = s?.description || '';
  document.getElementById('svc-sort').value = s?.sort_order ?? 0;
  document.getElementById('svc-visible').checked = s ? s.visible === 1 : true;
  document.getElementById('svc-modal').classList.add('active');
}

function closeSvcModal() {
  document.getElementById('svc-modal').classList.remove('active');
}

async function saveSvc(e) {
  e.preventDefault();
  const id = document.getElementById('svc-id').value;
  const body = {
    icon: document.getElementById('svc-icon').value || null,
    title: document.getElementById('svc-title').value,
    description: document.getElementById('svc-description').value || null,
    sort_order: parseInt(document.getElementById('svc-sort').value) || 0,
    visible: document.getElementById('svc-visible').checked,
  };
  try {
    const path = id ? `/admin/services/${id}` : '/admin/services';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closeSvcModal();
    showToast(id ? 'Service updated' : 'Service added');
    loadServices();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteSvc(id) {
  if (!confirm('Delete this service?')) return;
  try {
    await apiSend(`/admin/services/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadServices();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- PROJECTS ----------
async function loadProjects() {
  const items = await fetch('/api/admin/projects', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('projects-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No projects yet.</p>';
    return;
  }
  el.innerHTML = items.map(p => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${escapeHtml(p.title)}${p.visible ? '' : '<span class="badge-hidden">HIDDEN</span>'}</div>
        <div class="list-item-sub">${escapeHtml(p.description || '')}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" onclick='openProjModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteProj(${p.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openProjModal(p = null) {
  document.getElementById('proj-modal-title').textContent = p ? 'Edit Project' : 'Add Project';
  document.getElementById('proj-id').value = p?.id || '';
  document.getElementById('proj-title').value = p?.title || '';
  document.getElementById('proj-description').value = p?.description || '';
  document.getElementById('proj-image').value = p?.image_url || '';
  document.getElementById('proj-live').value = p?.live_url || '';
  document.getElementById('proj-repo').value = p?.repo_url || '';
  let tags = []; if (p?.tags) { try { tags = JSON.parse(p.tags); } catch {} }
  document.getElementById('proj-tags').value = tags.join(', ');
  document.getElementById('proj-sort').value = p?.sort_order ?? 0;
  document.getElementById('proj-visible').checked = p ? p.visible === 1 : true;
  document.getElementById('proj-modal').classList.add('active');
}

function closeProjModal() {
  document.getElementById('proj-modal').classList.remove('active');
}

async function saveProj(e) {
  e.preventDefault();
  const id = document.getElementById('proj-id').value;
  const body = {
    title: document.getElementById('proj-title').value,
    description: document.getElementById('proj-description').value || null,
    image_url: document.getElementById('proj-image').value || null,
    live_url: document.getElementById('proj-live').value || null,
    repo_url: document.getElementById('proj-repo').value || null,
    tags: document.getElementById('proj-tags').value.split(',').map(s => s.trim()).filter(Boolean),
    sort_order: parseInt(document.getElementById('proj-sort').value) || 0,
    visible: document.getElementById('proj-visible').checked,
  };
  try {
    const path = id ? `/admin/projects/${id}` : '/admin/projects';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closeProjModal();
    showToast(id ? 'Project updated' : 'Project added');
    loadProjects();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteProj(id) {
  if (!confirm('Delete this project?')) return;
  try {
    await apiSend(`/admin/projects/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadProjects();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- TESTIMONIALS ----------
async function loadTestimonials() {
  const items = await fetch('/api/admin/testimonials', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('testimonials-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No testimonials yet.</p>';
    return;
  }
  el.innerHTML = items.map(t => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${escapeHtml(t.author)}${t.visible ? '' : '<span class="badge-hidden">HIDDEN</span>'}</div>
        <div class="list-item-sub">"${escapeHtml((t.quote || '').slice(0, 80))}${t.quote?.length > 80 ? '...' : ''}"</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" onclick='openTestModal(${JSON.stringify(t).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteTest(${t.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openTestModal(t = null) {
  document.getElementById('test-modal-title').textContent = t ? 'Edit Testimonial' : 'Add Testimonial';
  document.getElementById('test-id').value = t?.id || '';
  document.getElementById('test-quote').value = t?.quote || '';
  document.getElementById('test-author').value = t?.author || '';
  document.getElementById('test-role').value = t?.role || '';
  document.getElementById('test-avatar').value = t?.avatar_url || '';
  document.getElementById('test-sort').value = t?.sort_order ?? 0;
  document.getElementById('test-visible').checked = t ? t.visible === 1 : true;
  document.getElementById('test-modal').classList.add('active');
}

function closeTestModal() {
  document.getElementById('test-modal').classList.remove('active');
}

async function saveTest(e) {
  e.preventDefault();
  const id = document.getElementById('test-id').value;
  const body = {
    quote: document.getElementById('test-quote').value,
    author: document.getElementById('test-author').value,
    role: document.getElementById('test-role').value || null,
    avatar_url: document.getElementById('test-avatar').value || null,
    sort_order: parseInt(document.getElementById('test-sort').value) || 0,
    visible: document.getElementById('test-visible').checked,
  };
  try {
    const path = id ? `/admin/testimonials/${id}` : '/admin/testimonials';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closeTestModal();
    showToast(id ? 'Testimonial updated' : 'Testimonial added');
    loadTestimonials();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteTest(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await apiSend(`/admin/testimonials/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadTestimonials();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- MESSAGES ----------
async function loadMessages() {
  const items = await fetch('/api/admin/messages', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('messages-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No messages yet.</p>';
    return;
  }
  el.innerHTML = items.map(m => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">
          ${escapeHtml(m.name)} &lt;${escapeHtml(m.email)}&gt;
          ${m.read ? '' : '<span class="badge-unread">NEW</span>'}
        </div>
        <div class="list-item-sub">
          ${m.subject ? `<strong>${escapeHtml(m.subject)}</strong> — ` : ''}
          ${escapeHtml((m.message || '').slice(0, 100))}${m.message?.length > 100 ? '...' : ''}
          <br><small style="color:#64748b;">${escapeHtml(m.created_at)}</small>
        </div>
      </div>
      <div class="list-item-actions">
        ${m.read ? '' : `<button class="btn btn-secondary btn-small" onclick="markRead(${m.id})">Mark Read</button>`}
        <button class="btn btn-danger btn-small" onclick="deleteMsg(${m.id})">Delete</button>
      </div>
    </div>
  `).join('');
  loadMessagesCount();
}

async function loadMessagesCount() {
  try {
    const items = await fetch('/api/admin/messages', { headers: authHeaders() }).then(r => r.json());
    const unread = items.filter(m => !m.read).length;
    const badge = document.getElementById('messages-badge');
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch {}
}

async function markRead(id) {
  try {
    await apiSend(`/admin/messages/${id}/read`, 'PUT', null, token);
    loadMessages();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteMsg(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await apiSend(`/admin/messages/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadMessages();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- SETTINGS ----------
async function loadSettings() {
  const c = await fetch('/api/config').then(r => r.json());
  document.getElementById('s-title').value = c.site_title || '';
  document.getElementById('s-meta').value = c.meta_description || '';
  document.getElementById('s-accent').value = c.accent_color || '#38bdf8';
  document.getElementById('s-accent2').value = c.accent_color_2 || '#7dd3fc';
  document.getElementById('s-resume').value = c.resume_url || '';
  document.getElementById('s-email').value = c.contact_email || '';
  document.getElementById('s-footer').value = c.footer_text || '';

  // Wave 2: availability
  const availEl = document.getElementById('s-available');
  if (availEl) availEl.checked = c.available_for_work === 1;
  const availTextEl = document.getElementById('s-availability-text');
  if (availTextEl) availTextEl.value = c.availability_text || 'Available for work';

  let visible = {};
  try { visible = JSON.parse(c.sections_visible || '{}'); } catch {}
  ['about','skills','experience','education','services','projects','testimonials','contact']
    .forEach(k => {
      const el = document.getElementById('s-section-' + k);
      if (el) el.checked = visible[k] !== false;
    });
}

async function saveSettings(e) {
  e.preventDefault();
  const sections = {};
  ['about','skills','experience','education','services','projects','testimonials','contact']
    .forEach(k => {
      const el = document.getElementById('s-section-' + k);
      if (el) sections[k] = el.checked;
    });

  const availEl = document.getElementById('s-available');
  const availTextEl = document.getElementById('s-availability-text');

  try {
    await apiSend('/admin/config', 'PUT', {
      site_title: document.getElementById('s-title').value,
      meta_description: document.getElementById('s-meta').value,
      accent_color: document.getElementById('s-accent').value,
      accent_color_2: document.getElementById('s-accent2').value,
      resume_url: document.getElementById('s-resume').value || null,
      contact_email: document.getElementById('s-email').value || null,
      footer_text: document.getElementById('s-footer').value,
      available_for_work: availEl ? availEl.checked : false,
      availability_text: availTextEl ? availTextEl.value : 'Available for work',
      sections_visible: sections,
    }, token);
    showToast('Settings saved');
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- BLOG POSTS ----------
async function loadPosts() {
  const items = await fetch('/api/admin/posts', { headers: authHeaders() }).then(r => r.json());
  const el = document.getElementById('posts-list');
  if (!items.length) {
    el.innerHTML = '<p class="empty">No posts yet. Click "+ New Post" to add one.</p>';
    return;
  }
  el.innerHTML = items.map(p => {
    let tags = [];
    try { tags = JSON.parse(p.tags || '[]'); } catch {}
    const badge = p.published
      ? '<span class="badge-unread" style="background:#22c55e;">PUBLISHED</span>'
      : '<span class="badge-hidden">DRAFT</span>';
    return `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-title">${escapeHtml(p.title)} ${badge}</div>
          <div class="list-item-sub">
            /${escapeHtml(p.slug)}
            ${tags.length ? ' · ' + tags.map(escapeHtml).join(', ') : ''}
            ${p.published_at ? ' · ' + new Date(p.published_at).toLocaleDateString() : ''}
          </div>
        </div>
        <div class="list-item-actions">
          <button class="btn btn-secondary btn-small" onclick='openPostModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn btn-danger btn-small" onclick="deletePost(${p.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function openPostModal(post = null) {
  document.getElementById('post-modal-title').textContent = post ? 'Edit Post' : 'New Post';
  document.getElementById('post-id').value = post?.id || '';
  document.getElementById('post-title').value = post?.title || '';
  document.getElementById('post-slug').value = post?.slug || '';
  document.getElementById('post-excerpt').value = post?.excerpt || '';
  document.getElementById('post-content').value = post?.content || '';
  document.getElementById('post-cover').value = post?.cover_image || '';
  let tags = [];
  if (post?.tags) { try { tags = JSON.parse(post.tags); } catch {} }
  document.getElementById('post-tags').value = tags.join(', ');
  document.getElementById('post-sort').value = post?.sort_order ?? 0;
  document.getElementById('post-published').checked = post ? post.published === 1 : false;
  document.getElementById('post-modal').classList.add('active');
}

function closePostModal() {
  document.getElementById('post-modal').classList.remove('active');
}

function autoSlug() {
  const titleEl = document.getElementById('post-title');
  const slugEl = document.getElementById('post-slug');
  if (slugEl.value.trim()) return;
  slugEl.value = titleEl.value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function savePost(e) {
  e.preventDefault();
  const id = document.getElementById('post-id').value;
  const body = {
    title: document.getElementById('post-title').value,
    slug: document.getElementById('post-slug').value,
    excerpt: document.getElementById('post-excerpt').value || null,
    content: document.getElementById('post-content').value || null,
    cover_image: document.getElementById('post-cover').value || null,
    tags: document.getElementById('post-tags').value.split(',').map(s => s.trim()).filter(Boolean),
    sort_order: parseInt(document.getElementById('post-sort').value) || 0,
    published: document.getElementById('post-published').checked,
  };
  try {
    const path = id ? `/admin/posts/${id}` : '/admin/posts';
    await apiSend(path, id ? 'PUT' : 'POST', body, token);
    closePostModal();
    showToast(id ? 'Post updated' : 'Post created');
    loadPosts();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    await apiSend(`/admin/posts/${id}`, 'DELETE', null, token);
    showToast('Deleted');
    loadPosts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ---------- HELPERS ----------
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  if (!m) return y;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1] || ''} ${y}`;
}

document.addEventListener('DOMContentLoaded', init);