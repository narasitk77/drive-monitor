// ============================================================
// CINEFLOW — SETTINGS MODAL (v1.1)
// Manages: Google Workspace integration, data export/import
// ============================================================

function showSettingsModal() {
  let modal = document.getElementById('settingsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.className = 'modal-overlay hidden fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.style.background = 'rgba(0,0,0,0.7)';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  }
  modal.innerHTML = renderSettingsHtml();
  modal.classList.remove('hidden');
}
window.showSettingsModal = showSettingsModal;

function renderSettingsHtml() {
  const config = getGwsConfig();
  const connected = isGwsConnected();
  const configured = isGwsConfigured();

  return `
    <div class="bg-dark-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl flex flex-col" style="max-height:90vh">
      <div class="p-5 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-dark-800 z-10 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <span style="font-size:24px">⚙️</span>
          <div>
            <h2 class="text-lg font-bold">Settings</h2>
            <p class="text-xs text-gray-500">Integrations & preferences</p>
          </div>
        </div>
        <button onclick="closeModal('settingsModal')" class="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-900">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-6 overflow-y-auto flex-1 space-y-6">

        <!-- ============== GOOGLE WORKSPACE ============== -->
        <section>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Google Workspace</h3>
          <div class="integration-card mb-4">
            <div class="integration-icon">
              <svg width="28" height="28" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold">Google Workspace</h4>
                <span class="integration-status ${connected ? 'connected' : 'disconnected'}">
                  ${connected ? '● Connected' : configured ? '○ Not signed in' : '○ Not configured'}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">Connect Drive, Calendar, Gmail, and Docs for full collaboration</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              ${configured ? (connected
                ? `<button onclick="gwsDisconnect(); setTimeout(showSettingsModal, 100)" class="btn btn-secondary btn-sm">Disconnect</button>`
                : `<button onclick="gwsConnect().then(() => setTimeout(showSettingsModal, 200))" class="btn btn-primary btn-sm">Sign In</button>`
              ) : ''}
            </div>
          </div>

          <!-- Configuration -->
          <div class="bg-dark-900 border border-gray-800 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="text-sm font-semibold">OAuth Configuration</h4>
                <p class="text-xs text-gray-500 mt-0.5">One-time setup — required to use Google features</p>
              </div>
              <button onclick="toggleGwsSetupGuide()" class="text-xs text-brand-400 hover:text-brand-300">
                <span id="gwsSetupGuideToggle">Show setup guide ▼</span>
              </button>
            </div>

            <div id="gwsSetupGuide" class="hidden mb-4 p-4 bg-dark-950 border border-gray-800 rounded-lg text-sm">
              <p class="text-gray-300 font-semibold mb-2">📋 Setup steps (~5 min):</p>
              <ol class="space-y-2 text-xs text-gray-400 list-decimal pl-5">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" class="text-brand-400 hover:underline">Google Cloud Console</a> and sign in with your Workspace account</li>
                <li>Create a new project (or select existing) — e.g. "CineFlow"</li>
                <li>Go to <strong>APIs & Services → Library</strong> and enable: <span class="font-mono text-gray-300">Drive API</span>, <span class="font-mono text-gray-300">Calendar API</span>, <span class="font-mono text-gray-300">Gmail API</span>, <span class="font-mono text-gray-300">Docs API</span></li>
                <li>Go to <strong>APIs & Services → OAuth consent screen</strong> and configure (Internal user type for your Workspace org)</li>
                <li>Go to <strong>APIs & Services → Credentials → + Create Credentials → OAuth Client ID</strong></li>
                <li>Application type: <strong>Web application</strong></li>
                <li>Under <strong>Authorized JavaScript origins</strong>, add:
                  <div class="font-mono bg-dark-800 px-2 py-1 rounded mt-1 text-gray-300 break-all">${window.location.origin}</div>
                </li>
                <li>Click Create — copy the <strong>Client ID</strong> (ends in <span class="font-mono">.apps.googleusercontent.com</span>)</li>
                <li>Paste it below and click Save</li>
              </ol>
              <div class="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
                <strong class="text-amber-400">🔒 Privacy:</strong> <span class="text-amber-200">Your access tokens are kept in browser memory only — never sent to any server. The Client ID is public and not a secret.</span>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-400 mb-1 block">Google OAuth Client ID</label>
                <input type="text" id="gwsClientIdInput" value="${escapeHtml(config.clientId || '')}" placeholder="123456789-xxxxxxxx.apps.googleusercontent.com" class="input-field font-mono text-xs">
              </div>
              <button onclick="saveGwsClientId()" class="btn btn-primary btn-sm w-full sm:w-auto">Save Configuration</button>
            </div>

            ${configured ? `
            <div class="mt-4 pt-4 border-t border-gray-800">
              <p class="text-xs font-semibold text-gray-400 mb-2">Available Features (when connected):</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-2 text-gray-400"><span>📁</span> Export to Google Drive</div>
                <div class="flex items-center gap-2 text-gray-400"><span>📅</span> Sync to Google Calendar</div>
                <div class="flex items-center gap-2 text-gray-400"><span>📧</span> Email call sheets via Gmail</div>
                <div class="flex items-center gap-2 text-gray-400"><span>📝</span> Export script to Google Docs</div>
              </div>
            </div>` : ''}
          </div>
        </section>

        <!-- ============== DATA MANAGEMENT ============== -->
        <section>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Data Management</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onclick="exportAllData()" class="bg-dark-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <div>
                  <div class="font-semibold text-sm">Export All Data</div>
                  <div class="text-xs text-gray-500">Download as JSON</div>
                </div>
              </div>
            </button>
            <label class="bg-dark-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <div>
                  <div class="font-semibold text-sm">Import Data</div>
                  <div class="text-xs text-gray-500">Restore from JSON file</div>
                </div>
              </div>
              <input type="file" accept=".json" class="hidden" onchange="importAllData(this)">
            </label>
          </div>
          <button onclick="clearAllData()" class="mt-3 text-xs text-red-400 hover:text-red-300">
            Clear all local data (cannot be undone)
          </button>
        </section>

        <!-- ============== ABOUT ============== -->
        <section>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">About</h3>
          <div class="bg-dark-900 border border-gray-800 rounded-xl p-4 text-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-400">Version</span>
              <span class="font-mono text-brand-400">${APP_VERSION}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-400">Storage</span>
              <span class="text-gray-300" id="storageInfo">${getStorageInfo()}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Browser</span>
              <span class="text-gray-300 text-xs">${getBrowserName()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function toggleGwsSetupGuide() {
  const guide = document.getElementById('gwsSetupGuide');
  const toggle = document.getElementById('gwsSetupGuideToggle');
  if (guide.classList.contains('hidden')) {
    guide.classList.remove('hidden');
    toggle.textContent = 'Hide setup guide ▲';
  } else {
    guide.classList.add('hidden');
    toggle.textContent = 'Show setup guide ▼';
  }
}
window.toggleGwsSetupGuide = toggleGwsSetupGuide;

function saveGwsClientId() {
  const value = document.getElementById('gwsClientIdInput').value.trim();
  if (value && !value.includes('.apps.googleusercontent.com')) {
    showToast('Client ID should end in .apps.googleusercontent.com', 'warning');
    return;
  }
  const config = getGwsConfig();
  config.clientId = value;
  saveGwsConfig(config);
  showToast(value ? 'OAuth Client ID saved' : 'OAuth configuration cleared', 'success');
  setTimeout(showSettingsModal, 200);
}
window.saveGwsClientId = saveGwsClientId;

function exportAllData() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: APP_VERSION,
    projects: JSON.parse(localStorage.getItem('cf_projects') || '[]'),
    gwsConfig: JSON.parse(localStorage.getItem('cf_gws_config') || '{}')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cineflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('Data exported successfully', 'success');
}
window.exportAllData = exportAllData;

function importAllData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.projects)) throw new Error('Invalid backup file');
      if (!confirm(`Import ${data.projects.length} projects? Current projects will be replaced.`)) return;
      localStorage.setItem('cf_projects', JSON.stringify(data.projects));
      if (data.gwsConfig) localStorage.setItem('cf_gws_config', JSON.stringify(data.gwsConfig));
      showToast(`Imported ${data.projects.length} projects`, 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}
window.importAllData = importAllData;

function clearAllData() {
  if (!confirm('⚠️ Delete ALL projects and settings? This cannot be undone.\n\nTip: Export your data first.')) return;
  if (!confirm('Are you absolutely sure? Last chance.')) return;
  localStorage.removeItem('cf_projects');
  localStorage.removeItem('cf_gws_config');
  localStorage.removeItem('cf_lastSeenVersion');
  showToast('All data cleared', 'info');
  setTimeout(() => window.location.reload(), 800);
}
window.clearAllData = clearAllData;

function getStorageInfo() {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith('cf_')) total += localStorage[key].length;
    }
    return (total / 1024).toFixed(1) + ' KB';
  } catch { return 'unknown'; }
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}
