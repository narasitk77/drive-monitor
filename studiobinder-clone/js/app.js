// ============================================================
// CINEFLOW — APP.JS — Dashboard Logic (v1.1)
// Note: Toast, modals, escape, formatDate moved to ui-utils.js
// ============================================================

let currentFilter = 'all';
let selectedColor = '#0ea5e9';

// ---- DATA LAYER ----
function getProjects() { return JSON.parse(localStorage.getItem('cf_projects') || '[]'); }
function saveProjects(p) { localStorage.setItem('cf_projects', JSON.stringify(p)); }

// ---- FILTER ----
function filterProjects(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('filter-' + f)?.classList.add('active');
  renderProjects();
}
window.filterProjects = filterProjects;

// ---- SELECT COLOR ----
function selectColor(c) {
  selectedColor = c;
  document.querySelectorAll('.color-swatch').forEach(s => { s.style.outline = ''; s.style.outlineOffset = ''; });
  const el = document.querySelector(`.color-swatch[data-color="${c}"]`);
  if (el) { el.style.outline = '2px solid ' + c; el.style.outlineOffset = '2px'; }
}
window.selectColor = selectColor;

// ---- CREATE PROJECT ----
function createProject() {
  const title = getVal('newTitle').trim();
  if (!title) { showToast('Please enter a project title', 'warning'); return; }
  const projects = getProjects();
  const project = {
    id: 'proj_' + Date.now(),
    title,
    type: getVal('newType'),
    status: getVal('newStatus'),
    director: getVal('newDirector'),
    startDate: getVal('newStart'),
    endDate: getVal('newEnd'),
    color: selectedColor,
    createdAt: new Date().toISOString(),
    script: [],
    breakdown: { scenes: [] },
    shotList: [],
    callSheets: [],
    contacts: [],
    tasks: { todo: [], inProgress: [], done: [] },
    calendar: [],
    moodboard: []
  };
  projects.push(project);
  saveProjects(projects);
  closeModal('newProjectModal');
  clearNewProjectForm();
  renderProjects();
  updateStats();
  showToast(`Project "${title}" created`, 'success');
}
window.createProject = createProject;

function clearNewProjectForm() {
  ['newTitle','newDirector','newStart','newEnd'].forEach(id => setVal(id, ''));
  setVal('newType', 'Feature Film');
  setVal('newStatus', 'development');
  selectedColor = '#0ea5e9';
  document.querySelectorAll('.color-swatch').forEach(s => { s.style.outline = ''; s.style.outlineOffset = ''; });
  const first = document.querySelector('.color-swatch[data-color="#0ea5e9"]');
  if (first) { first.style.outline = '2px solid #0ea5e9'; first.style.outlineOffset = '2px'; }
}

// ---- DELETE / DUPLICATE ----
function deleteProject(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this project? This cannot be undone.')) return;
  const projects = getProjects();
  const removed = projects.find(p => p.id === id);
  saveProjects(projects.filter(p => p.id !== id));
  renderProjects();
  updateStats();
  showToast(`Deleted "${removed?.title || 'project'}"`, 'info');
}
window.deleteProject = deleteProject;

function duplicateProject(id, e) {
  e.stopPropagation();
  const projects = getProjects();
  const p = projects.find(pr => pr.id === id);
  if (!p) return;
  const copy = JSON.parse(JSON.stringify(p));
  copy.id = 'proj_' + Date.now();
  copy.title = p.title + ' (Copy)';
  copy.createdAt = new Date().toISOString();
  projects.push(copy);
  saveProjects(projects);
  renderProjects();
  updateStats();
  showToast(`Duplicated "${p.title}"`, 'success');
}
window.duplicateProject = duplicateProject;

// ---- STATUS LABELS ----
const statusLabels = {
  development: 'Development',
  active: 'Pre-Production',
  production: 'Production',
  post: 'Post-Production',
  completed: 'Completed'
};

// ---- RENDER ----
function renderProjects() {
  const projects = getProjects();
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let filtered = projects.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search) || (p.director||'').toLowerCase().includes(search);
    const matchFilter = currentFilter === 'all' ||
      (currentFilter === 'active' && (p.status === 'active' || p.status === 'production')) ||
      (currentFilter === 'development' && p.status === 'development') ||
      (currentFilter === 'completed' && p.status === 'completed');
    return matchSearch && matchFilter;
  });
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('emptyState');
  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = filtered.map(p => renderProjectCard(p)).join('');
}
window.renderProjects = renderProjects;

function renderProjectCard(p) {
  const totalTasks = (p.tasks?.todo?.length||0)+(p.tasks?.inProgress?.length||0)+(p.tasks?.done?.length||0);
  return `
    <div class="project-card fade-in" onclick="openProject('${p.id}')">
      <div class="project-card-header" style="background:${p.color}"></div>
      <div class="project-card-body">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <span class="project-type-badge">${escapeHtml(p.type)}</span>
            <h3 class="text-base font-bold mt-2 leading-tight truncate">${escapeHtml(p.title)}</h3>
            ${p.director ? `<p class="text-xs text-gray-500 mt-0.5 truncate">Dir. ${escapeHtml(p.director)}</p>` : ''}
          </div>
          <div class="relative ml-2 flex-shrink-0" onclick="event.stopPropagation()">
            <button onclick="toggleProjectMenu('${p.id}', event)" class="text-gray-600 hover:text-gray-300 p-1.5 rounded hover:bg-dark-900">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01"/></svg>
            </button>
            <div id="menu-${p.id}" class="hidden absolute right-0 top-8 bg-dark-950 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden w-40">
              <button onclick="openProject('${p.id}')" class="w-full text-left px-3 py-2 text-xs hover:bg-dark-800 text-gray-300">Open</button>
              <button onclick="duplicateProject('${p.id}', event)" class="w-full text-left px-3 py-2 text-xs hover:bg-dark-800 text-gray-300">Duplicate</button>
              <button onclick="deleteProject('${p.id}', event)" class="w-full text-left px-3 py-2 text-xs hover:bg-dark-800 text-red-400">Delete</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between mt-auto">
          <span class="status-badge status-${p.status}">
            <span class="status-dot" style="background:currentColor"></span>
            ${statusLabels[p.status] || p.status}
          </span>
          ${p.startDate ? `<span class="text-xs text-gray-600">${formatDateShort(p.startDate)}</span>` : ''}
        </div>
        <div class="mt-3 flex items-center gap-1.5 border-t border-gray-800 pt-3">
          ${moduleIconBadge('✍️', p.script?.length || 0)}
          ${moduleIconBadge('🎬', p.shotList?.length || 0)}
          ${moduleIconBadge('📋', totalTasks)}
          ${moduleIconBadge('👥', p.contacts?.length || 0)}
        </div>
      </div>
    </div>
  `;
}

function moduleIconBadge(icon, count) {
  return `<div class="flex items-center gap-1 text-xs text-gray-600 bg-dark-900 rounded-lg px-2 py-1 flex-1 justify-center">
    <span>${icon}</span>
    <span class="font-medium text-gray-400">${count}</span>
  </div>`;
}

function toggleProjectMenu(id, e) {
  e.stopPropagation();
  // Close all other menus
  document.querySelectorAll('[id^="menu-"]').forEach(m => { if (m.id !== `menu-${id}`) m.classList.add('hidden'); });
  document.getElementById('menu-' + id)?.classList.toggle('hidden');
}
window.toggleProjectMenu = toggleProjectMenu;

// Click outside to close menus
document.addEventListener('click', () => {
  document.querySelectorAll('[id^="menu-"]').forEach(m => m.classList.add('hidden'));
});

// ---- STATS ----
function updateStats() {
  const projects = getProjects();
  document.getElementById('statProjects').textContent = projects.length;
  document.getElementById('statActive').textContent = projects.filter(p => p.status === 'active' || p.status === 'production').length;
  document.getElementById('statDraft').textContent = projects.filter(p => p.status === 'development').length;
  document.getElementById('statCompleted').textContent = projects.filter(p => p.status === 'completed').length;
}

// ---- OPEN PROJECT ----
function openProject(id) { window.location.href = `project.html?id=${id}`; }
window.openProject = openProject;

// ---- SEED DEMO ----
function seedDemoData() {
  if (getProjects().length > 0) return;
  const demos = [
    { title: 'The Last Chapter', type: 'Feature Film', status: 'active', director: 'Sarah Connor', color: '#0ea5e9', startDate: '2026-05-01', endDate: '2026-08-30' },
    { title: 'Neon Drift', type: 'Short Film', status: 'development', director: 'Marcus Chen', color: '#8b5cf6', startDate: '2026-06-15', endDate: '' },
    { title: 'The Standard Ads Q2', type: 'Commercial', status: 'production', director: '', color: '#10b981', startDate: '2026-05-08', endDate: '2026-05-20' }
  ];
  const projects = demos.map((d, i) => ({
    id: 'proj_demo_' + i,
    ...d,
    createdAt: new Date().toISOString(),
    script: [],
    breakdown: { scenes: [] },
    shotList: i === 0 ? [
      { id: 's1', scene: '1', shot: 'A', type: 'Wide Shot', angle: 'Eye Level', movement: 'Static', desc: 'Establishing shot of city', lens: '24mm' },
      { id: 's2', scene: '1', shot: 'B', type: 'Medium Shot', angle: 'Eye Level', movement: 'Pan', desc: 'Protagonist walks down street', lens: '50mm' }
    ] : [],
    callSheets: [],
    contacts: i === 0 ? [
      { id: 'c1', name: 'Sarah Connor', role: 'Director', dept: 'Directing', phone: '+66 81 234 5678', email: 'sarah@studio.com', callTime: '06:00' },
      { id: 'c2', name: 'James Park', role: 'Director of Photography', dept: 'Camera', phone: '+66 81 876 5432', email: 'james@studio.com', callTime: '06:30' }
    ] : [],
    tasks: { todo: i===0?[{id:'t1',title:'Finalize script',priority:'high',due:'2026-05-15'},{id:'t2',title:'Confirm locations',priority:'medium',due:'2026-05-20'}]:[], inProgress: i===0?[{id:'t3',title:'Cast auditions',priority:'high',due:'2026-05-12'}]:[], done: i===0?[{id:'t4',title:'Submit permits',priority:'low',due:'2026-05-01'}]:[] },
    calendar: [],
    moodboard: []
  }));
  saveProjects(projects);
}

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
  seedDemoData();
  renderProjects();
  updateStats();
  // init color swatch
  const first = document.querySelector('.color-swatch[data-color="#0ea5e9"]');
  if (first) { first.style.outline = '2px solid #0ea5e9'; first.style.outlineOffset = '2px'; }
});
