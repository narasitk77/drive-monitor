// ============================================================
// CINEFLOW — v1.2 NEW MODULES
//   • Stripboard (drag-drop scene scheduling)
//   • Storyboard (per-shot frame uploads)
//   • Media Library (file links + Drive integration)
//   • Reports (breakdown summary across all scenes)
// ============================================================

// ============================================================
// STRIPBOARD MODULE
// ============================================================
// Visual scene scheduler — drag scenes between shoot days
// Data: project.stripboard = { days: [{ date, label, sceneIds:[...] }], banner: '...' }

const STRIP_TIME_COLORS = {
  DAY: '#fbbf24', NIGHT: '#1e3a8a', DAWN: '#fb923c', DUSK: '#7c3aed', '': '#6b7280'
};
const STRIP_INTEXT_COLORS = {
  INT: '#10b981', EXT: '#0ea5e9', 'INT/EXT': '#8b5cf6', '': '#6b7280'
};

function renderStripboard() {
  const p = getProject();
  if (!p) return;
  const el = document.getElementById('view-stripboard');
  if (!el) return;
  if (!p.stripboard) p.stripboard = { days: [], unscheduled: [] };
  const sb = p.stripboard;
  const scenes = (p.breakdown?.scenes || []);

  // Determine scheduled scene IDs
  const scheduledIds = new Set();
  sb.days.forEach(d => (d.sceneIds || []).forEach(id => scheduledIds.add(id)));
  const unscheduledScenes = scenes.filter((s, i) => !scheduledIds.has(s.id || ('sc_' + i)));
  // Ensure scenes have IDs
  scenes.forEach((s, i) => { if (!s.id) s.id = 'sc_' + i; });

  el.innerHTML = `
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 class="text-xl font-bold">Stripboard</h2>
        <p class="text-xs text-gray-500 mt-0.5">Drag scenes between shoot days to schedule production</p>
      </div>
      <div class="flex gap-2">
        <button onclick="addStripDay()" class="btn btn-primary btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Shoot Day
        </button>
      </div>
    </div>

    ${scenes.length === 0 ? `<div class="text-center py-12 text-gray-600">
      <div class="text-4xl mb-3">📋</div>
      <p>Add scenes in the Breakdown module first.</p>
      <button onclick="switchModule('breakdown')" class="text-brand-400 hover:text-brand-300 text-sm mt-2">Go to Breakdown →</button>
    </div>` : `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- UNSCHEDULED -->
      <div class="lg:col-span-3">
        <div class="bg-dark-900 border border-gray-800 rounded-xl p-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-400">Unscheduled</h3>
            <span class="text-xs text-gray-600">${unscheduledScenes.length}</span>
          </div>
          <div id="strip-unscheduled" class="strip-zone min-h-32" ondragover="stripDragOver(event)" ondrop="stripDrop(event, '__unscheduled__')">
            ${unscheduledScenes.map(s => renderStrip(s)).join('') || '<p class="text-xs text-gray-700 text-center py-4">All scenes scheduled</p>'}
          </div>
        </div>
      </div>

      <!-- SHOOT DAYS -->
      <div class="lg:col-span-9">
        ${sb.days.length === 0 ? `<div class="bg-dark-900 border border-gray-800 rounded-xl p-6 text-center text-gray-600">
          <p class="mb-3">No shoot days yet. Click "+ Add Shoot Day" to start scheduling.</p>
        </div>` : sb.days.map((day, di) => renderStripDay(day, di, scenes)).join('')}
      </div>
    </div>`}
  `;
}
window.renderStripboard = renderStripboard;

function renderStrip(scene) {
  const intExt = scene.int_ext || 'INT';
  const time = scene.time || 'DAY';
  return `
    <div class="strip" draggable="true" ondragstart="stripDragStart(event, '${scene.id}')" data-id="${scene.id}">
      <div class="strip-color" style="background:${STRIP_TIME_COLORS[time] || '#6b7280'}"></div>
      <div class="strip-body">
        <div class="strip-scene-num">${escapeHtml(String(scene.num || '?'))}</div>
        <div class="strip-info truncate" title="${escapeHtml(scene.heading || '')}">${escapeHtml(scene.heading || 'Untitled')}</div>
        <div class="strip-icons">
          <span style="color:${STRIP_INTEXT_COLORS[intExt]}" title="${intExt}">${intExt[0]}</span>
          <span class="text-gray-500">${escapeHtml(time)}</span>
        </div>
      </div>
    </div>`;
}

function renderStripDay(day, di, scenes) {
  const dayScenes = (day.sceneIds || []).map(id => scenes.find(s => s.id === id)).filter(Boolean);
  return `
    <div class="bg-dark-900 border border-gray-800 rounded-xl p-3 mb-3">
      <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded">DAY ${di + 1}</span>
          <input type="date" value="${day.date || ''}" onchange="updateStripDay(${di}, 'date', this.value)" class="input-field text-xs py-1 w-36">
          <input type="text" value="${escapeHtml(day.label || '')}" placeholder="Label (e.g. Studio A)" onchange="updateStripDay(${di}, 'label', this.value)" class="input-field text-xs py-1 w-40">
          <span class="text-xs text-gray-600">${dayScenes.length} scene${dayScenes.length === 1 ? '' : 's'}</span>
        </div>
        <button onclick="deleteStripDay(${di})" class="text-red-600 hover:text-red-400 text-xs">Remove Day</button>
      </div>
      <div id="strip-day-${di}" class="strip-zone min-h-20" ondragover="stripDragOver(event)" ondrop="stripDrop(event, ${di})">
        ${dayScenes.length === 0 ? '<p class="text-xs text-gray-700 text-center py-4">Drop scenes here</p>' : dayScenes.map(s => renderStrip(s)).join('')}
      </div>
    </div>`;
}

let stripDragSceneId = null;
function stripDragStart(e, id) { stripDragSceneId = id; e.dataTransfer.effectAllowed = 'move'; }
function stripDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drag-over'); }
function stripDrop(e, target) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!stripDragSceneId) return;
  updateProject(p => {
    if (!p.stripboard) p.stripboard = { days: [], unscheduled: [] };
    // Remove from current location
    p.stripboard.days.forEach(d => { d.sceneIds = (d.sceneIds || []).filter(id => id !== stripDragSceneId); });
    // Add to target
    if (target !== '__unscheduled__') {
      if (!p.stripboard.days[target].sceneIds) p.stripboard.days[target].sceneIds = [];
      p.stripboard.days[target].sceneIds.push(stripDragSceneId);
    }
  });
  stripDragSceneId = null;
  renderStripboard();
}
window.stripDragStart = stripDragStart;
window.stripDragOver = stripDragOver;
window.stripDrop = stripDrop;

function addStripDay() {
  updateProject(p => {
    if (!p.stripboard) p.stripboard = { days: [], unscheduled: [] };
    p.stripboard.days.push({ date: '', label: '', sceneIds: [] });
  });
  renderStripboard();
  showToast('Shoot day added', 'success');
}
window.addStripDay = addStripDay;

function updateStripDay(di, field, val) {
  updateProject(p => { if (p.stripboard?.days?.[di]) p.stripboard.days[di][field] = val; });
}
window.updateStripDay = updateStripDay;

function deleteStripDay(di) {
  if (!confirm('Remove this shoot day? Scenes will go back to Unscheduled.')) return;
  updateProject(p => p.stripboard?.days?.splice(di, 1));
  renderStripboard();
}
window.deleteStripDay = deleteStripDay;

// ============================================================
// STORYBOARD MODULE
// ============================================================
// Per-shot frame images. Data: each shot.frames = [{url, caption}]
function renderStoryboard() {
  const p = getProject();
  if (!p) return;
  const el = document.getElementById('view-storyboard');
  if (!el) return;
  const shots = p.shotList || [];
  el.innerHTML = `
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 class="text-xl font-bold">Storyboard</h2>
        <p class="text-xs text-gray-500 mt-0.5">Visual frames per shot — sketch references, photos, AI mockups</p>
      </div>
      <div class="text-xs text-gray-500">${shots.length} shots</div>
    </div>
    ${shots.length === 0 ? `<div class="text-center py-12 text-gray-600">
      <div class="text-4xl mb-3">🎬</div>
      <p>Add shots in the Shot List module first.</p>
      <button onclick="switchModule('shotlist')" class="text-brand-400 hover:text-brand-300 text-sm mt-2">Go to Shot List →</button>
    </div>` : `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${shots.map((s, i) => renderStoryboardCard(s, i)).join('')}
    </div>`}
  `;
}
window.renderStoryboard = renderStoryboard;

function renderStoryboardCard(shot, i) {
  const frames = shot.frames || [];
  const main = frames[0]?.url || '';
  return `
    <div class="bg-dark-900 border border-gray-800 rounded-xl overflow-hidden">
      <div class="aspect-video bg-dark-950 flex items-center justify-center relative group">
        ${main ? `<img src="${escapeHtml(main)}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : `
          <div class="text-center text-gray-700">
            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p class="text-xs">No frame yet</p>
          </div>`}
        <label class="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded-md text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
          + Frame
          <input type="file" class="hidden" accept="image/*" onchange="addStoryboardFrame('${shot.id}', this)">
        </label>
        <div class="absolute top-2 left-2 bg-brand-500 text-white px-2 py-1 rounded-md text-xs font-bold">${escapeHtml(shot.scene||'')}${escapeHtml(shot.shot||'')}</div>
      </div>
      <div class="p-3">
        <div class="flex items-center justify-between mb-1">
          <p class="text-sm font-medium truncate">${escapeHtml(shot.desc || 'Untitled shot')}</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span>${escapeHtml(shot.type || '—')}</span><span>·</span>
          <span>${escapeHtml(shot.angle || '—')}</span><span>·</span>
          <span>${escapeHtml(shot.movement || '—')}</span>
        </div>
        ${frames.length > 1 ? `
        <div class="mt-2 flex gap-1 overflow-x-auto">
          ${frames.map((f, fi) => `<img src="${escapeHtml(f.url)}" class="w-12 h-12 object-cover rounded border border-gray-700 cursor-pointer" onclick="setMainFrame('${shot.id}', ${fi})">`).join('')}
        </div>` : ''}
      </div>
    </div>`;
}

function addStoryboardFrame(shotId, input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    updateProject(p => {
      const shot = p.shotList.find(s => s.id === shotId);
      if (!shot) return;
      if (!shot.frames) shot.frames = [];
      shot.frames.unshift({ url: e.target.result, caption: file.name });
    });
    renderStoryboard();
    showToast('Frame added', 'success');
  };
  reader.readAsDataURL(file);
}
window.addStoryboardFrame = addStoryboardFrame;

function setMainFrame(shotId, frameIdx) {
  updateProject(p => {
    const shot = p.shotList.find(s => s.id === shotId);
    if (!shot?.frames) return;
    const [f] = shot.frames.splice(frameIdx, 1);
    shot.frames.unshift(f);
  });
  renderStoryboard();
}
window.setMainFrame = setMainFrame;

// ============================================================
// MEDIA LIBRARY MODULE
// ============================================================
// Centralized file/link library. Data: project.mediaLibrary = [{ id, type, name, url, addedAt, mimeType, size }]

function renderMediaLibrary() {
  const p = getProject();
  if (!p) return;
  const el = document.getElementById('view-media');
  if (!el) return;
  const items = p.mediaLibrary || [];

  el.innerHTML = `
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 class="text-xl font-bold">Media Library</h2>
        <p class="text-xs text-gray-500 mt-0.5">Centralized file references — links, Drive files, downloads</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        ${isGwsConfigured() ? `<button onclick="loadDriveFiles()" class="btn btn-secondary btn-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
          Browse Drive
        </button>` : ''}
        <button onclick="addMediaLink()" class="btn btn-primary btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
          Add Link
        </button>
      </div>
    </div>

    ${items.length === 0 ? `<div class="text-center py-12 text-gray-600">
      <div class="text-4xl mb-3">📎</div>
      <p class="mb-2">No media items yet.</p>
      <p class="text-xs">Add file links or browse your Google Drive.</p>
    </div>` : `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${items.map(it => renderMediaCard(it)).join('')}
    </div>`}
  `;
}
window.renderMediaLibrary = renderMediaLibrary;

function renderMediaCard(it) {
  const icon = it.iconLink || mediaIcon(it.mimeType || it.type || '');
  const isImage = (it.mimeType || '').startsWith('image/');
  return `
    <div class="bg-dark-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
      <div class="flex items-start gap-3">
        ${it.thumbnailLink || isImage ? `<img src="${escapeHtml(it.thumbnailLink || it.url)}" class="w-12 h-12 rounded object-cover flex-shrink-0">` :
          `<div class="w-12 h-12 rounded bg-dark-950 flex items-center justify-center flex-shrink-0 text-2xl">${icon}</div>`}
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm truncate">${escapeHtml(it.name || 'Untitled')}</div>
          <div class="text-xs text-gray-500 mt-0.5 truncate">${escapeHtml(it.type || it.mimeType || 'link')}</div>
          ${it.modifiedTime ? `<div class="text-xs text-gray-600 mt-0.5">${formatDate(it.modifiedTime.split('T')[0])}</div>` : ''}
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 pt-2 border-t border-gray-800">
        <a href="${escapeHtml(it.url)}" target="_blank" class="text-xs text-brand-400 hover:text-brand-300 flex-1">Open ↗</a>
        <button onclick="deleteMediaItem('${it.id}')" class="text-red-700 hover:text-red-400 text-xs">Remove</button>
      </div>
    </div>`;
}

function mediaIcon(type) {
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type.includes('pdf')) return '📕';
  if (type.includes('document')) return '📝';
  if (type.includes('spreadsheet')) return '📊';
  if (type.includes('presentation')) return '📽️';
  if (type.includes('folder')) return '📁';
  return '📎';
}

function addMediaLink() {
  const url = prompt('Enter URL:');
  if (!url) return;
  const name = prompt('Name (optional):') || url.replace(/^https?:\/\//, '').slice(0, 50);
  updateProject(p => {
    if (!p.mediaLibrary) p.mediaLibrary = [];
    p.mediaLibrary.unshift({ id: 'm_' + Date.now(), type: 'link', name, url, addedAt: new Date().toISOString() });
  });
  renderMediaLibrary();
  showToast('Link added', 'success');
}
window.addMediaLink = addMediaLink;

function deleteMediaItem(id) {
  if (!confirm('Remove this item?')) return;
  updateProject(p => { p.mediaLibrary = (p.mediaLibrary || []).filter(it => it.id !== id); });
  renderMediaLibrary();
}
window.deleteMediaItem = deleteMediaItem;

async function loadDriveFiles() {
  try {
    showToast('Loading Drive files...', 'info');
    const files = await gwsDriveListRecentFiles(30);
    if (!files.length) { showToast('No files found', 'info'); return; }
    updateProject(p => {
      if (!p.mediaLibrary) p.mediaLibrary = [];
      const existing = new Set(p.mediaLibrary.map(it => it.url));
      for (const f of files) {
        if (existing.has(f.webViewLink)) continue;
        p.mediaLibrary.unshift({
          id: 'm_drv_' + f.id, type: 'drive', name: f.name, url: f.webViewLink,
          mimeType: f.mimeType, iconLink: f.iconLink, thumbnailLink: f.thumbnailLink,
          modifiedTime: f.modifiedTime, addedAt: new Date().toISOString()
        });
      }
    });
    renderMediaLibrary();
    showToast(`Imported ${files.length} files from Drive`, 'success');
  } catch (err) {
    showToast('Drive load failed: ' + err.message, 'error');
  }
}
window.loadDriveFiles = loadDriveFiles;

// ============================================================
// REPORTS MODULE
// ============================================================
// Aggregate breakdown across all scenes (which props appear in which scenes, etc.)

function renderReports() {
  const p = getProject();
  if (!p) return;
  const el = document.getElementById('view-reports');
  if (!el) return;
  const scenes = p.breakdown?.scenes || [];

  // Aggregate elements by category
  const aggregated = {};
  BREAKDOWN_CATEGORIES.forEach(cat => { aggregated[cat.key] = {}; });
  scenes.forEach(scene => {
    BREAKDOWN_CATEGORIES.forEach(cat => {
      (scene.elements?.[cat.key] || []).forEach(elem => {
        if (!aggregated[cat.key][elem]) aggregated[cat.key][elem] = [];
        aggregated[cat.key][elem].push(scene.num || '?');
      });
    });
  });

  // Stats
  const totalScenes = scenes.length;
  const totalShots = (p.shotList || []).length;
  const totalContacts = (p.contacts || []).length;
  const intCount = scenes.filter(s => (s.int_ext || '').includes('INT')).length;
  const extCount = scenes.filter(s => (s.int_ext || '').includes('EXT')).length;
  const dayCount = scenes.filter(s => (s.time || '').includes('DAY')).length;
  const nightCount = scenes.filter(s => (s.time || '').includes('NIGHT')).length;

  el.innerHTML = `
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 class="text-xl font-bold">Production Reports</h2>
        <p class="text-xs text-gray-500 mt-0.5">Aggregate breakdown across all scenes</p>
      </div>
      <button onclick="printReports()" class="btn btn-secondary btn-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
        Print
      </button>
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-dark-900 border border-gray-800 rounded-xl p-4">
        <div class="text-xl font-bold text-brand-400">${totalScenes}</div>
        <div class="text-xs text-gray-500 mt-1">Total Scenes</div>
      </div>
      <div class="bg-dark-900 border border-gray-800 rounded-xl p-4">
        <div class="text-xl font-bold text-purple-400">${totalShots}</div>
        <div class="text-xs text-gray-500 mt-1">Total Shots</div>
      </div>
      <div class="bg-dark-900 border border-gray-800 rounded-xl p-4">
        <div class="text-xl font-bold text-green-400">${intCount}/${extCount}</div>
        <div class="text-xs text-gray-500 mt-1">INT / EXT</div>
      </div>
      <div class="bg-dark-900 border border-gray-800 rounded-xl p-4">
        <div class="text-xl font-bold text-amber-400">${dayCount}/${nightCount}</div>
        <div class="text-xs text-gray-500 mt-1">DAY / NIGHT</div>
      </div>
    </div>

    ${totalScenes === 0 ? `<div class="text-center py-12 text-gray-600">
      <div class="text-4xl mb-3">📊</div>
      <p>Add scenes in Breakdown to see reports.</p>
    </div>` : `
    <!-- Element reports per category -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${BREAKDOWN_CATEGORIES.map(cat => {
        const items = Object.entries(aggregated[cat.key] || {});
        if (!items.length) return '';
        return `
        <div class="bg-dark-900 border border-gray-800 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-sm" style="color:${cat.color}">${cat.label}</h3>
            <span class="text-xs text-gray-600">${items.length} unique</span>
          </div>
          <div class="space-y-1.5 max-h-64 overflow-y-auto">
            ${items.sort((a, b) => b[1].length - a[1].length).map(([name, sceneNums]) => `
              <div class="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-dark-800">
                <span class="text-sm truncate">${escapeHtml(name)}</span>
                <div class="flex gap-1 flex-wrap justify-end">
                  ${sceneNums.slice(0, 5).map(n => `<span class="text-xs bg-dark-950 text-gray-400 px-1.5 py-0.5 rounded font-mono">SC ${escapeHtml(String(n))}</span>`).join('')}
                  ${sceneNums.length > 5 ? `<span class="text-xs text-gray-600">+${sceneNums.length - 5}</span>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>`;
      }).filter(Boolean).join('') || '<p class="text-gray-600 text-sm">No tagged elements yet. Add tags in Breakdown.</p>'}
    </div>`}
  `;
}
window.renderReports = renderReports;

function printReports() { window.print(); }
window.printReports = printReports;
