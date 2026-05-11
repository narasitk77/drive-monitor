// ============================================================
// CINEFLOW — GOOGLE WORKSPACE INTEGRATION (v1.1)
// ============================================================
//
// This module provides full Google Workspace integration:
//   • Google Drive  — export call sheets, scripts, project data
//   • Google Calendar — sync production calendar events
//   • Gmail — send call sheets to cast & crew
//   • Google Docs — export script to formatted Google Doc
//   • Google Contacts — import existing contacts
//
// SETUP (one-time, by user):
//   1. Go to https://console.cloud.google.com/
//   2. Create a new project (or use existing)
//   3. Enable: Drive API, Calendar API, Gmail API, Docs API
//   4. Create OAuth 2.0 Client ID (Web application)
//   5. Add http://localhost:8899 to Authorized JavaScript origins
//      (and your production domain if deploying)
//   6. Copy the Client ID and paste it into Settings → Google Workspace
//
// TECH:
//   Uses Google Identity Services (GIS) — the modern replacement
//   for the deprecated gapi.auth2 library.
//
// SECURITY:
//   • Access tokens are kept in memory only (never persisted)
//   • Client ID is stored in localStorage (not a secret)
//   • Only requests scopes that are needed for selected features
// ============================================================

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

const GWS_SCOPES = {
  drive:    'https://www.googleapis.com/auth/drive.file',
  calendar: 'https://www.googleapis.com/auth/calendar.events',
  gmail:    'https://www.googleapis.com/auth/gmail.send',
  docs:     'https://www.googleapis.com/auth/documents',
  contacts: 'https://www.googleapis.com/auth/contacts.readonly'
};

let gwsTokenClient = null;
let gwsAccessToken = null;
let gwsTokenExpiry = 0;
let gisLoaded = false;

// ---- CONFIG ----
function getGwsConfig() {
  return JSON.parse(localStorage.getItem('cf_gws_config') || '{}');
}
function saveGwsConfig(c) {
  localStorage.setItem('cf_gws_config', JSON.stringify(c));
}
function isGwsConfigured() {
  const c = getGwsConfig();
  return !!(c.clientId && c.clientId.includes('.apps.googleusercontent.com'));
}
function isGwsConnected() {
  return isGwsConfigured() && gwsAccessToken && Date.now() < gwsTokenExpiry;
}

// ---- LOAD GIS SCRIPT ----
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (gisLoaded || window.google?.accounts?.oauth2) { gisLoaded = true; return resolve(); }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => { gisLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

// ---- AUTHENTICATION ----
async function gwsConnect(scopesNeeded = ['drive', 'calendar', 'gmail', 'docs']) {
  const config = getGwsConfig();
  if (!config.clientId) {
    showToast('Please configure Google Workspace in Settings first', 'warning');
    return false;
  }

  await loadGisScript();

  const scopeString = scopesNeeded.map(s => GWS_SCOPES[s]).filter(Boolean).join(' ');

  return new Promise((resolve, reject) => {
    gwsTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: scopeString,
      callback: (response) => {
        if (response.error) {
          showToast('Connection failed: ' + response.error, 'error');
          return reject(response);
        }
        gwsAccessToken = response.access_token;
        gwsTokenExpiry = Date.now() + (response.expires_in * 1000);
        showToast('Connected to Google Workspace', 'success');
        // Update settings to remember connection state
        const c = getGwsConfig();
        c.lastConnected = Date.now();
        c.connectedScopes = scopesNeeded;
        saveGwsConfig(c);
        if (typeof onGwsConnected === 'function') onGwsConnected();
        resolve(true);
      },
      error_callback: (err) => {
        showToast('Connection error: ' + (err.message || 'Unknown'), 'error');
        reject(err);
      }
    });
    gwsTokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

function gwsDisconnect() {
  if (gwsAccessToken && window.google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(gwsAccessToken, () => {});
  }
  gwsAccessToken = null;
  gwsTokenExpiry = 0;
  const c = getGwsConfig();
  delete c.lastConnected;
  delete c.connectedScopes;
  saveGwsConfig(c);
  showToast('Disconnected from Google Workspace', 'info');
  if (typeof onGwsDisconnected === 'function') onGwsDisconnected();
}

async function ensureConnected(scopesNeeded) {
  if (isGwsConnected()) return true;
  return gwsConnect(scopesNeeded);
}

async function gwsApiFetch(url, options = {}) {
  if (!gwsAccessToken) throw new Error('Not connected to Google Workspace');
  const headers = { ...(options.headers || {}), Authorization: 'Bearer ' + gwsAccessToken };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// ============================================================
// GOOGLE DRIVE
// ============================================================

async function gwsDriveCreateFolder(name, parentId) {
  await ensureConnected(['drive']);
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {})
  };
  return gwsApiFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  });
}

async function gwsDriveUploadFile(name, content, mimeType, parentId) {
  await ensureConnected(['drive']);
  const metadata = { name, ...(parentId ? { parents: [parentId] } : {}) };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelim;
  return gwsApiFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
}

async function gwsExportProjectToDrive(project) {
  try {
    showToast('Exporting to Google Drive...', 'info');
    // 1. Create a folder for the project
    const folder = await gwsDriveCreateFolder(`CineFlow — ${project.title}`);

    // 2. Export project data as JSON
    await gwsDriveUploadFile(
      `${project.title}-data.json`,
      JSON.stringify(project, null, 2),
      'application/json',
      folder.id
    );

    // 3. Export script as text
    if (project.script?.length) {
      const scriptText = formatScriptForExport(project);
      await gwsDriveUploadFile(`${project.title}-script.txt`, scriptText, 'text/plain', folder.id);
    }

    // 4. Export shot list as CSV
    if (project.shotList?.length) {
      const csv = formatShotListAsCsv(project.shotList);
      await gwsDriveUploadFile(`${project.title}-shotlist.csv`, csv, 'text/csv', folder.id);
    }

    // 5. Export contacts as CSV
    if (project.contacts?.length) {
      const csv = formatContactsAsCsv(project.contacts);
      await gwsDriveUploadFile(`${project.title}-contacts.csv`, csv, 'text/csv', folder.id);
    }

    // 6. Export call sheet as HTML
    if (project.callSheets?.length) {
      const html = formatCallSheetAsHtml(project, project.callSheets[0]);
      await gwsDriveUploadFile(`${project.title}-callsheet.html`, html, 'text/html', folder.id);
    }

    showToast(`Exported to Drive: "${folder.name}"`, 'success');
    window.open(`https://drive.google.com/drive/folders/${folder.id}`, '_blank');
    return folder;
  } catch (err) {
    console.error(err);
    showToast('Export failed: ' + err.message, 'error');
  }
}

// ============================================================
// GOOGLE CALENDAR
// ============================================================

async function gwsCalendarCreateEvent(event, projectColor) {
  await ensureConnected(['calendar']);
  const dateOnly = event.date;
  const colorMap = { shoot:'11', prep:'9', scout:'10', audition:'3', meeting:'5', post:'8', deadline:'6', other:'8' };
  const calendarEvent = {
    summary: event.title,
    description: (event.notes || '') + '\n\nCreated by CineFlow',
    start: { date: dateOnly },
    end: { date: dateOnly },
    colorId: colorMap[event.type] || '8'
  };
  return gwsApiFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(calendarEvent)
  });
}

async function gwsSyncCalendarToGoogle(project) {
  try {
    if (!project.calendar?.length) {
      showToast('No calendar events to sync', 'info');
      return;
    }
    showToast(`Syncing ${project.calendar.length} events to Google Calendar...`, 'info');
    let success = 0;
    for (const ev of project.calendar) {
      try {
        await gwsCalendarCreateEvent(ev, project.color);
        success++;
      } catch (err) {
        console.error('Failed to sync event', ev, err);
      }
    }
    showToast(`Synced ${success}/${project.calendar.length} events to Google Calendar`, 'success');
  } catch (err) {
    showToast('Sync failed: ' + err.message, 'error');
  }
}

// ============================================================
// GMAIL — SEND CALL SHEET
// ============================================================

async function gwsSendCallSheetEmail(project, recipients, subject, body) {
  await ensureConnected(['gmail']);

  // Build RFC 2822 message
  const message = [
    `To: ${recipients.join(', ')}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body
  ].join('\r\n');

  // Base64url encode
  const raw = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return gwsApiFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  });
}

async function gwsEmailCallSheet(project) {
  try {
    const cs = project.callSheets?.[0];
    if (!cs) { showToast('No call sheet to send', 'warning'); return; }

    const recipients = (project.contacts || []).filter(c => c.email).map(c => c.email);
    if (!recipients.length) { showToast('No contacts with email addresses', 'warning'); return; }

    if (!confirm(`Send call sheet to ${recipients.length} recipient(s)?\n\n${recipients.join('\n')}`)) return;

    const subject = `Call Sheet — ${project.title} — Day ${cs.day || '1'} (${cs.date || 'TBD'})`;
    const html = formatCallSheetAsHtml(project, cs);

    showToast('Sending call sheet via Gmail...', 'info');
    await gwsSendCallSheetEmail(project, recipients, subject, html);
    showToast(`Call sheet sent to ${recipients.length} recipient(s)`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Send failed: ' + err.message, 'error');
  }
}

// ============================================================
// GOOGLE DOCS — EXPORT SCRIPT
// ============================================================

async function gwsExportScriptToDoc(project) {
  try {
    if (!project.script?.length) {
      showToast('Script is empty', 'warning');
      return;
    }
    await ensureConnected(['docs', 'drive']);
    showToast('Creating Google Doc...', 'info');

    // 1. Create empty doc
    const doc = await gwsApiFetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: project.title + ' — Script' })
    });

    // 2. Build batch update requests with formatting
    const requests = [];
    let cursor = 1;

    // Title
    const titleText = project.title.toUpperCase() + '\n\n';
    requests.push({ insertText: { location: { index: cursor }, text: titleText } });
    requests.push({
      updateTextStyle: {
        range: { startIndex: cursor, endIndex: cursor + titleText.length - 1 },
        textStyle: { bold: true, fontSize: { magnitude: 18, unit: 'PT' } },
        fields: 'bold,fontSize'
      }
    });
    cursor += titleText.length;

    // Each script line
    for (const line of project.script) {
      let text = (line.text || '') + '\n';
      const startIdx = cursor;
      requests.push({ insertText: { location: { index: cursor }, text } });
      const endIdx = cursor + text.length - 1;

      if (line.type === 'scene') {
        requests.push({
          updateTextStyle: {
            range: { startIndex: startIdx, endIndex: endIdx },
            textStyle: { bold: true, foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.4, blue: 0.8 } } } },
            fields: 'bold,foregroundColor'
          }
        });
      } else if (line.type === 'character') {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: startIdx, endIndex: endIdx },
            paragraphStyle: { alignment: 'CENTER', indentStart: { magnitude: 0, unit: 'PT' } },
            fields: 'alignment,indentStart'
          }
        });
        requests.push({
          updateTextStyle: {
            range: { startIndex: startIdx, endIndex: endIdx },
            textStyle: { bold: true },
            fields: 'bold'
          }
        });
      } else if (line.type === 'transition') {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: startIdx, endIndex: endIdx },
            paragraphStyle: { alignment: 'END' },
            fields: 'alignment'
          }
        });
        requests.push({
          updateTextStyle: {
            range: { startIndex: startIdx, endIndex: endIdx },
            textStyle: { bold: true },
            fields: 'bold'
          }
        });
      }
      cursor += text.length;
    }

    // 3. Apply batch update
    await gwsApiFetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });

    showToast('Script exported to Google Docs', 'success');
    window.open(`https://docs.google.com/document/d/${doc.documentId}/edit`, '_blank');
  } catch (err) {
    console.error(err);
    showToast('Export failed: ' + err.message, 'error');
  }
}

// ============================================================
// FORMATTERS / HELPERS
// ============================================================

function formatScriptForExport(project) {
  const lines = (project.script || []).map(l => {
    const prefix = l.type === 'scene' ? '\n\n' : l.type === 'character' ? '\n\n          ' : l.type === 'dialogue' ? '          ' : l.type === 'parenthetical' ? '     ' : l.type === 'transition' ? '\n                    ' : '';
    return prefix + (l.text || '');
  }).join('\n');
  return project.title.toUpperCase() + '\n' + (project.director ? 'Directed by ' + project.director + '\n' : '') + '\n' + lines;
}

function formatShotListAsCsv(shotList) {
  const header = 'Scene,Shot,Description,Type,Angle,Movement,Lens,Notes';
  const rows = shotList.map(s => {
    const esc = v => `"${(v || '').replace(/"/g, '""')}"`;
    return [s.scene, s.shot, s.desc, s.type, s.angle, s.movement, s.lens, s.notes].map(esc).join(',');
  });
  return header + '\n' + rows.join('\n');
}

function formatContactsAsCsv(contacts) {
  const header = 'Name,Role,Department,Email,Phone,Call Time';
  const rows = contacts.map(c => {
    const esc = v => `"${(v || '').replace(/"/g, '""')}"`;
    return [c.name, c.role, c.dept, c.email, c.phone, c.callTime].map(esc).join(',');
  });
  return header + '\n' + rows.join('\n');
}

function formatCallSheetAsHtml(project, cs) {
  const contacts = (project.contacts || []).map(c =>
    `<tr><td>${c.name || ''}</td><td>${c.role || ''}</td><td>${c.dept || ''}</td><td>${c.callTime || ''}</td></tr>`
  ).join('');
  const scenes = (cs.scenes || []).map(s =>
    `<tr><td>${s.num || ''}</td><td>${s.heading || ''}</td><td>${s.pages || ''}</td></tr>`
  ).join('');
  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"><title>Call Sheet — ${project.title}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #111; }
    h1 { border-bottom: 3px solid ${project.color || '#0ea5e9'}; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; }
    .meta-grid div { padding: 4px 0; }
    .meta-grid strong { color: #6b7280; font-weight: 500; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  </style></head>
  <body>
    <h1>${project.title}</h1>
    <p style="color:#6b7280;margin-bottom:24px">Day ${cs.day || '1'} • ${cs.date || 'TBD'}</p>

    <h2>Production</h2>
    <div class="meta-grid">
      <div><strong>Director:</strong> ${cs.director || project.director || '—'}</div>
      <div><strong>Producer:</strong> ${cs.producer || '—'}</div>
      <div><strong>1st AD:</strong> ${cs.ad || '—'}</div>
      <div><strong>General Call:</strong> ${cs.calltime || '—'}</div>
    </div>

    <h2>Location</h2>
    <div class="meta-grid">
      <div><strong>Location:</strong> ${cs.location || '—'}</div>
      <div><strong>Address:</strong> ${cs.address || '—'}</div>
      <div><strong>Nearest Hospital:</strong> ${cs.hospital || '—'}</div>
    </div>

    ${scenes ? `<h2>Scene Schedule</h2>
    <table><thead><tr><th>SC#</th><th>Scene Heading</th><th>Pages</th></tr></thead><tbody>${scenes}</tbody></table>` : ''}

    ${contacts ? `<h2>Cast & Crew</h2>
    <table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Call Time</th></tr></thead><tbody>${contacts}</tbody></table>` : ''}

    ${cs.notes ? `<h2>Notes</h2><p>${(cs.notes||'').replace(/\n/g,'<br>')}</p>` : ''}

    <div class="footer">Generated by CineFlow • ${new Date().toLocaleString()}</div>
  </body></html>`;
}

// ============================================================
// EXPOSE TO WINDOW
// ============================================================
window.gwsConnect = gwsConnect;
window.gwsDisconnect = gwsDisconnect;
window.isGwsConfigured = isGwsConfigured;
window.isGwsConnected = isGwsConnected;
window.getGwsConfig = getGwsConfig;
window.saveGwsConfig = saveGwsConfig;
window.gwsExportProjectToDrive = gwsExportProjectToDrive;
window.gwsSyncCalendarToGoogle = gwsSyncCalendarToGoogle;
window.gwsEmailCallSheet = gwsEmailCallSheet;
window.gwsExportScriptToDoc = gwsExportScriptToDoc;
window.gwsApiFetch = gwsApiFetch;
window.ensureConnected = ensureConnected;
window.formatCallSheetAsHtml = formatCallSheetAsHtml;
window.formatScriptForExport = formatScriptForExport;

// ============================================================
// GOOGLE DRIVE — PICK FILES (Media Library integration)
// ============================================================
async function gwsDriveListRecentFiles(limit = 20) {
  await ensureConnected(['drive']);
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${limit}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,size)`;
  const res = await gwsApiFetch(url);
  return res.files || [];
}
window.gwsDriveListRecentFiles = gwsDriveListRecentFiles;

// ============================================================
// GOOGLE SHEETS — Export shot list to Sheets
// ============================================================
async function gwsExportShotListToSheets(project) {
  try {
    if (!project.shotList?.length) { showToast('Shot list is empty', 'warning'); return; }
    await ensureConnected(['drive']);
    showToast('Creating Google Sheet...', 'info');
    const csv = formatShotListAsCsv(project.shotList);
    // Upload as Google Sheet (Drive will convert)
    const metadata = { name: project.title + ' — Shot List', mimeType: 'application/vnd.google-apps.spreadsheet' };
    const boundary = '-------SHOTLIST' + Date.now();
    const body =
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` + JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: text/csv\r\n\r\n` + csv +
      `\r\n--${boundary}--`;
    const res = await gwsApiFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body
    });
    showToast('Shot list exported to Google Sheets', 'success');
    window.open(`https://docs.google.com/spreadsheets/d/${res.id}/edit`, '_blank');
  } catch (err) { console.error(err); showToast('Export failed: ' + err.message, 'error'); }
}
window.gwsExportShotListToSheets = gwsExportShotListToSheets;
