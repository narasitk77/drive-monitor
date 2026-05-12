// ============================================================
// CINEFLOW — UI UTILITIES (v1.1)
// Shared helpers: toasts, mobile menu, modals, escape, etc.
// ============================================================

// ===== TOAST NOTIFICATIONS =====
function ensureToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    error:   '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    info:    '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };
  toast.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
window.showToast = showToast;

// ===== HTML ESCAPE =====
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
window.escapeHtml = escapeHtml;

// ===== MODAL HELPERS =====
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}
window.openModal = openModal;
window.closeModal = closeModal;

// Close modal on overlay click + ESC
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });
});

// ===== MOBILE DRAWER =====
function openMobileDrawer() {
  document.getElementById('mobileDrawer')?.classList.add('open');
  document.getElementById('mobileDrawerOverlay')?.classList.add('open');
}
function closeMobileDrawer() {
  document.getElementById('mobileDrawer')?.classList.remove('open');
  document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
}
window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;

// ===== DATE FORMATTERS =====
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
window.formatDate = formatDate;

function formatDateShort(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
window.formatDateShort = formatDateShort;

// ===== INPUT HELPERS =====
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }
window.getVal = getVal;
window.setVal = setVal;

// ===== AVATAR =====
const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#84cc16'];
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
window.avatarColor = avatarColor;
window.initials = initials;

// ===== SEEN/UNSEEN BADGES (for changelog "NEW" badge) =====
const APP_VERSION = '1.3.0';
function getLastSeenVersion() { return localStorage.getItem('cf_lastSeenVersion') || '0.0.0'; }
function markVersionSeen() { localStorage.setItem('cf_lastSeenVersion', APP_VERSION); }
function hasUnseenChangelog() { return getLastSeenVersion() !== APP_VERSION; }
window.APP_VERSION = APP_VERSION;
window.getLastSeenVersion = getLastSeenVersion;
window.markVersionSeen = markVersionSeen;
window.hasUnseenChangelog = hasUnseenChangelog;

// ===== CHANGELOG DATA =====
const CHANGELOG = [
  {
    version: '1.3.0',
    date: '2026-05-12',
    title: 'Login-First Flow — Sign in with Google',
    sections: [
      {
        title: '✨ New',
        items: [
          'Brand new full-screen Login overlay — appears first on every visit',
          '"Sign in with Google" button requests Drive, Calendar, Gmail, Docs scopes in one go',
          'User profile (name, email, avatar) appears in top-right after sign-in',
          'Click avatar → user menu with Settings · What\'s New · Sign out',
          'Default OAuth Client ID pre-configured for the @thestandard.co org',
          'Session restore — token kept in sessionStorage so refreshing the page does not require re-auth',
          '"Continue without signing in" option for local-only/offline mode'
        ]
      },
      {
        title: '🎨 UX',
        items: [
          'Animated gradient background on login screen',
          'Glassmorphism login card with feature preview',
          'Smooth fade-in/fade-out transitions',
          'Loading spinner on sign-in button during OAuth flow',
          'User menu shows real Google profile picture'
        ]
      },
      {
        title: '🔧 Technical',
        items: [
          'New file js/auth-gate.js — runs before app to enforce login',
          'Added DEFAULT_CLIENT_ID constant in google-integration.js',
          'Added gwsUserProfile + userinfo API integration',
          'Added restoreGwsSession() — reuses sessionStorage token across page navigations'
        ]
      }
    ]
  },
  {
    version: '1.2.0',
    date: '2026-05-09',
    title: 'Full StudioBinder Parity — 4 New Modules',
    sections: [
      {
        title: '✨ New Modules',
        items: [
          '🗂️ Stripboard — drag-and-drop scene scheduler with shoot day blocks',
          '🖼️ Storyboard — per-shot frame uploads with main/alt frames',
          '📎 Media Library — centralized file references + Drive browser integration',
          '📊 Reports — aggregate breakdown across all scenes (props, cast, etc.)'
        ]
      },
      {
        title: '🔗 Google Workspace Enhancements',
        items: [
          'Browse and import Google Drive files into Media Library',
          'Export shot list to Google Sheets (auto-converted from CSV)',
          'Exposed gwsApiFetch and ensureConnected helpers'
        ]
      },
      {
        title: '🎬 StudioBinder Feature Parity',
        items: [
          'Now matches StudioBinder\'s 5 main categories: Write, Breakdown, Visualize, Plan, Shoot',
          'Plus reports/analytics — production summary at a glance',
          'Total: 13 modules covering full production workflow'
        ]
      },
      {
        title: '🐛 Fixes',
        items: [
          'Comprehensive end-to-end audit — all 60+ functions verified',
          'Exposed updateProject, getProjects, BREAKDOWN_CATEGORIES to window for module reuse',
          'Fixed module switching for newly added modules'
        ]
      }
    ]
  },
  {
    version: '1.1.0',
    date: '2026-05-09',
    title: 'UX Overhaul + Google Workspace',
    sections: [
      {
        title: '✨ New Features',
        items: [
          'In-app Changelog page (this one!) — never miss what\'s new',
          'Google Workspace integration: Drive, Calendar, Gmail, Docs',
          'Settings page for managing integrations and OAuth',
          'Toast notifications for action feedback',
          'Mobile bottom tab bar — universal navigation on phone',
          'Hamburger menu drawer on mobile',
          'Export project to Google Drive (full bundle: script, shotlist, contacts, callsheet)',
          'Sync calendar events to Google Calendar',
          'Send call sheet to crew via Gmail',
          'Export script to Google Docs (formatted)'
        ]
      },
      {
        title: '🎨 UI/UX Improvements',
        items: [
          'Mobile-first responsive design — works perfectly on phones, tablets, desktops',
          'Larger tap targets (44px+) for mobile usability',
          'Bottom-sheet modals on mobile (swipe-friendly)',
          'Improved button styles with hover/active states',
          'Print-optimized call sheet styling',
          'Refined dark theme with better contrast',
          'Smoother transitions and micro-interactions',
          'Better empty states with action prompts'
        ]
      },
      {
        title: '🔧 Technical',
        items: [
          'Split UI utilities into separate js/ui-utils.js for reuse',
          'Added js/google-integration.js — uses Google Identity Services (GIS)',
          'Access tokens kept in memory only (never persisted)',
          'OAuth scopes requested on-demand based on feature used',
          'New CSS architecture with semantic class names'
        ]
      }
    ]
  },
  {
    version: '1.0.0',
    date: '2026-05-08',
    title: 'Initial Release',
    sections: [
      {
        title: '🎉 Launch',
        items: [
          'Dashboard with project management (CRUD, filter, search)',
          'Script Writer — 6 line types with industry-standard formatting',
          'Script Breakdown — 12 element categories per scene',
          'Shot List — comprehensive shot specifications',
          'Call Sheet builder with print support',
          'Production Calendar with 8 event types',
          'Contacts management grouped by department',
          'Task Board (Kanban) with drag-and-drop',
          'Moodboard with image upload + URL support',
          'localStorage persistence — no backend required'
        ]
      }
    ]
  }
];
window.CHANGELOG = CHANGELOG;

// ===== SHOW CHANGELOG MODAL =====
function showChangelogModal() {
  let modal = document.getElementById('changelogModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'changelogModal';
    modal.className = 'modal-overlay hidden fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.innerHTML = `
      <div class="bg-dark-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl">
        <div class="p-5 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-dark-800 z-10 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span style="font-size:24px">🎬</span>
            <div>
              <h2 class="text-lg font-bold">What's New in CineFlow</h2>
              <p class="text-xs text-gray-500">Version history & release notes</p>
            </div>
          </div>
          <button onclick="closeModal('changelogModal'); markVersionSeen(); updateChangelogBadge && updateChangelogBadge();" class="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-900">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-6" id="changelogContent">
          ${renderChangelogHtml()}
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.add('hidden'); markVersionSeen(); if(window.updateChangelogBadge) updateChangelogBadge(); } });
  } else {
    document.getElementById('changelogContent').innerHTML = renderChangelogHtml();
  }
  modal.classList.remove('hidden');
}
window.showChangelogModal = showChangelogModal;

function renderChangelogHtml() {
  return CHANGELOG.map((entry, idx) => `
    <div class="changelog-entry">
      <div class="flex items-baseline gap-2 mb-2">
        <span class="changelog-version" style="${idx === 0 ? 'background:rgba(14,165,233,0.15);border-color:#0ea5e9;color:#7dd3fc' : ''}">v${entry.version}</span>
        <span class="changelog-date">${entry.date}</span>
        ${idx === 0 ? '<span class="badge-new" style="margin-left:6px">Latest</span>' : ''}
      </div>
      <h3 class="text-base font-semibold text-gray-100 mb-3">${entry.title}</h3>
      ${entry.sections.map(sec => `
        <div class="changelog-section-title" style="color:${
          sec.title.includes('New') ? '#0ea5e9' :
          sec.title.includes('UI') || sec.title.includes('Improve') ? '#8b5cf6' :
          sec.title.includes('Fix') ? '#10b981' :
          sec.title.includes('Tech') ? '#f59e0b' : '#9ca3af'
        }">${sec.title}</div>
        ${sec.items.map(item => `<div class="changelog-item">${escapeHtml(item)}</div>`).join('')}
      `).join('')}
    </div>
  `).join('');
}

// ===== UPDATE CHANGELOG BADGE (red dot if unseen) =====
function updateChangelogBadge() {
  document.querySelectorAll('[data-changelog-badge]').forEach(el => {
    el.style.display = hasUnseenChangelog() ? 'block' : 'none';
  });
}
window.updateChangelogBadge = updateChangelogBadge;

// ===== AUTO-SHOW CHANGELOG ON FIRST LOAD AFTER UPDATE =====
window.addEventListener('DOMContentLoaded', () => {
  updateChangelogBadge();
  // Auto-show after 1s if user hasn't seen latest version (only on dashboard)
  if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
    if (hasUnseenChangelog() && getLastSeenVersion() !== '0.0.0') {
      setTimeout(() => showChangelogModal(), 800);
    }
  }
});
