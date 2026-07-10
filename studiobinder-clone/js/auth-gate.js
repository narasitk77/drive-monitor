// ============================================================
// CINEFLOW — AUTH GATE (v1.3)
// ============================================================
// Login-first flow:
//   1. On every page load, check if user has a valid Google session
//   2. If yes  → silently restore + hide overlay (proceed to app)
//   3. If no   → show full-screen login overlay with "Sign in with Google"
//   4. After successful sign-in → fade out overlay, app renders
//
// User can also "Continue without signing in" — fallback to local-only mode.
// In that case, GWS features are gated behind sign-in when invoked.
// ============================================================

const AUTH_SKIP_KEY = 'cf_auth_skipped';
const AUTH_REQUIRE_GATE = true; // set false to allow direct access without login screen

function isUserSignedIn() {
  // Has a valid in-memory token OR we successfully restored one
  if (typeof gwsAccessToken !== 'undefined' && gwsAccessToken && Date.now() < gwsTokenExpiry) return true;
  if (typeof restoreGwsSession === 'function' && restoreGwsSession()) return true;
  return false;
}
window.isUserSignedIn = isUserSignedIn;

function userSkippedAuth() {
  return sessionStorage.getItem(AUTH_SKIP_KEY) === '1';
}

function injectAuthOverlay() {
  // If overlay already exists, no-op
  if (document.getElementById('authOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.innerHTML = `
    <div class="auth-bg-glow"></div>
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-logo">
          <div class="auth-logo-mark">CF</div>
        </div>
        <h1 class="auth-title">CineFlow</h1>
        <p class="auth-subtitle">Production management for film &amp; video teams</p>
      </div>

      <div class="auth-features">
        <div class="auth-feature"><span>📝</span><span>Script · Breakdown · Shot List</span></div>
        <div class="auth-feature"><span>🎬</span><span>Call Sheets · Stripboard · Storyboard</span></div>
        <div class="auth-feature"><span>🔗</span><span>Drive · Calendar · Gmail · Docs</span></div>
      </div>

      <button class="auth-google-btn" onclick="authSignIn()" id="authSignInBtn">
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
        <span>Sign in with Google</span>
      </button>

      <div class="auth-divider"><span>or</span></div>

      <button class="auth-skip-btn" onclick="authSkip()">Continue without signing in</button>

      <div class="auth-footer">
        <p class="auth-fineprint">By signing in, you grant CineFlow access to your Drive, Calendar, Gmail &amp; Docs<br>for production collaboration. Access tokens are kept in memory only.</p>
        <p class="auth-version">v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.3'}</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Inject styles
  if (!document.getElementById('authOverlayStyles')) {
    const style = document.createElement('style');
    style.id = 'authOverlayStyles';
    style.textContent = `
      #authOverlay {
        position: fixed; inset: 0; z-index: 999;
        background: linear-gradient(135deg, #0d1117 0%, #141824 60%, #0c4a6e 200%);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
        animation: authFadeIn 0.4s ease-out;
      }
      #authOverlay.closing { animation: authFadeOut 0.4s ease-in forwards; }
      @keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes authFadeOut { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }

      .auth-bg-glow {
        position: absolute; inset: 0; pointer-events: none; overflow: hidden;
      }
      .auth-bg-glow::before, .auth-bg-glow::after {
        content: ''; position: absolute; width: 600px; height: 600px;
        border-radius: 50%; filter: blur(120px); opacity: 0.3;
      }
      .auth-bg-glow::before {
        background: #0ea5e9; top: -200px; left: -100px;
        animation: authGlow1 8s ease-in-out infinite alternate;
      }
      .auth-bg-glow::after {
        background: #8b5cf6; bottom: -200px; right: -100px;
        animation: authGlow2 10s ease-in-out infinite alternate;
      }
      @keyframes authGlow1 { from { transform: translate(0,0); } to { transform: translate(60px, 40px); } }
      @keyframes authGlow2 { from { transform: translate(0,0); } to { transform: translate(-50px, -30px); } }

      .auth-card {
        position: relative; z-index: 1;
        background: rgba(20, 24, 36, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 24px;
        padding: 40px 36px 28px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 24px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
      }

      .auth-brand { text-align: center; margin-bottom: 28px; }
      .auth-logo { display: flex; justify-content: center; margin-bottom: 16px; }
      .auth-logo-mark {
        width: 56px; height: 56px; border-radius: 16px;
        background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 18px; color: white;
        box-shadow: 0 8px 20px -4px rgba(14,165,233,0.5);
      }
      .auth-title { font-size: 26px; font-weight: 700; color: #f3f4f6; margin-bottom: 4px; letter-spacing: -0.02em; }
      .auth-subtitle { font-size: 13px; color: #9ca3af; }

      .auth-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
      .auth-feature {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px;
        font-size: 13px; color: #d1d5db;
      }
      .auth-feature span:first-child { font-size: 16px; }

      .auth-google-btn {
        width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
        padding: 13px 16px;
        background: white; color: #1f2937;
        border: none; border-radius: 10px;
        font-size: 14px; font-weight: 600;
        cursor: pointer; transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .auth-google-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
      .auth-google-btn:active { transform: translateY(0); }
      .auth-google-btn:disabled { opacity: 0.6; cursor: wait; }

      .auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 14px; }
      .auth-divider::before, .auth-divider::after {
        content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
      }
      .auth-divider span { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }

      .auth-skip-btn {
        width: 100%; padding: 11px 16px;
        background: transparent; color: #9ca3af;
        border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
        font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.2s;
      }
      .auth-skip-btn:hover { background: rgba(255,255,255,0.04); color: #f3f4f6; border-color: rgba(255,255,255,0.15); }

      .auth-footer { margin-top: 24px; text-align: center; }
      .auth-fineprint { font-size: 10px; color: #6b7280; line-height: 1.6; }
      .auth-version { font-size: 10px; color: #4b5563; margin-top: 8px; font-family: monospace; }

      .auth-loading {
        display: inline-block; width: 16px; height: 16px;
        border: 2px solid rgba(0,0,0,0.2); border-top-color: #1f2937;
        border-radius: 50%; animation: authSpin 0.8s linear infinite;
      }
      @keyframes authSpin { to { transform: rotate(360deg); } }

      /* Mobile */
      @media (max-width: 480px) {
        .auth-card { padding: 32px 24px 24px; border-radius: 20px; }
        .auth-title { font-size: 22px; }
        .auth-feature { font-size: 12px; padding: 9px 12px; }
      }
    `;
    document.head.appendChild(style);
  }
}

async function authSignIn() {
  const btn = document.getElementById('authSignInBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="auth-loading"></span><span>Signing in...</span>';
  }
  try {
    await gwsConnect(DEFAULT_LOGIN_SCOPES);
    // Clear the "skipped" flag if user signs in
    sessionStorage.removeItem(AUTH_SKIP_KEY);
    closeAuthOverlay();
    if (typeof onAuthSuccess === 'function') onAuthSuccess();
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
        <span>Sign in with Google</span>`;
    }
    // user cancelled or error — keep overlay visible
  }
}
window.authSignIn = authSignIn;

function authSkip() {
  sessionStorage.setItem(AUTH_SKIP_KEY, '1');
  closeAuthOverlay();
  if (typeof showToast === 'function') showToast('Continuing in local-only mode. Sign in anytime from Settings.', 'info');
}
window.authSkip = authSkip;

function closeAuthOverlay() {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  overlay.classList.add('closing');
  setTimeout(() => overlay.remove(), 400);
}
window.closeAuthOverlay = closeAuthOverlay;

function showAuthOverlay() {
  injectAuthOverlay();
}
window.showAuthOverlay = showAuthOverlay;

// ============================================================
// GATE: run before app initializes
// ============================================================
function runAuthGate() {
  if (!AUTH_REQUIRE_GATE) return;
  // Already signed in? skip
  if (isUserSignedIn()) {
    // Refresh badge
    setTimeout(() => updateUserBadge?.(), 100);
    return;
  }
  // User previously chose to skip in this session
  if (userSkippedAuth()) {
    setTimeout(() => updateUserBadge?.(), 100);
    return;
  }
  // Otherwise show overlay
  showAuthOverlay();
}

window.addEventListener('DOMContentLoaded', () => {
  // Run after a tick so other scripts (project page) finish loading the project
  setTimeout(runAuthGate, 50);
});

// ============================================================
// USER BADGE (in nav)
// ============================================================
function updateUserBadge() {
  const profile = gwsUserProfile;
  document.querySelectorAll('[data-user-badge]').forEach(el => {
    if (profile) {
      el.innerHTML = profile.picture
        ? `<img src="${profile.picture}" alt="${profile.name||''}" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
        : (profile.name||profile.email||'U').slice(0,2).toUpperCase();
      el.title = profile.email || profile.name || '';
      el.dataset.signedIn = '1';
    } else {
      // Fallback initials
      el.innerHTML = 'NK';
      el.title = 'Not signed in — click to sign in';
      el.dataset.signedIn = '0';
    }
  });
}
window.updateUserBadge = updateUserBadge;

// Show user menu when avatar clicked
function toggleUserMenu(event) {
  event?.stopPropagation();
  const existing = document.getElementById('userMenu');
  if (existing) { existing.remove(); return; }
  const profile = gwsUserProfile;
  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.style.cssText = 'position:fixed;right:16px;top:56px;background:#1e2330;border:1px solid #374151;border-radius:12px;padding:8px;min-width:240px;z-index:200;box-shadow:0 12px 32px rgba(0,0,0,0.5)';
  if (profile) {
    menu.innerHTML = `
      <div style="padding:12px 12px 14px;border-bottom:1px solid #374151;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:10px">
          ${profile.picture ? `<img src="${profile.picture}" referrerpolicy="no-referrer" style="width:36px;height:36px;border-radius:50%;object-fit:cover">` : `<div style="width:36px;height:36px;border-radius:50%;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-weight:700;color:white">${(profile.name||'U').slice(0,1)}</div>`}
          <div style="min-width:0;flex:1">
            <div style="font-size:13px;font-weight:600;color:#f3f4f6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${profile.name||''}</div>
            <div style="font-size:11px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${profile.email||''}</div>
          </div>
        </div>
      </div>
      <button onclick="showSettingsModal();document.getElementById('userMenu')?.remove()" style="width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#d1d5db;background:transparent;border:none;border-radius:6px;cursor:pointer">⚙️ Settings</button>
      <button onclick="showChangelogModal();document.getElementById('userMenu')?.remove()" style="width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#d1d5db;background:transparent;border:none;border-radius:6px;cursor:pointer">🔔 What's New</button>
      <div style="height:1px;background:#374151;margin:6px 0"></div>
      <button onclick="gwsDisconnect();updateUserBadge();document.getElementById('userMenu')?.remove();setTimeout(()=>showAuthOverlay(),200)" style="width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#f87171;background:transparent;border:none;border-radius:6px;cursor:pointer">↩ Sign out</button>
    `;
  } else {
    menu.innerHTML = `
      <div style="padding:12px;font-size:12px;color:#9ca3af">Not signed in</div>
      <button onclick="showAuthOverlay();document.getElementById('userMenu')?.remove()" style="width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#0ea5e9;background:transparent;border:none;border-radius:6px;cursor:pointer;font-weight:600">→ Sign in with Google</button>
      <button onclick="showSettingsModal();document.getElementById('userMenu')?.remove()" style="width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#d1d5db;background:transparent;border:none;border-radius:6px;cursor:pointer">⚙️ Settings</button>
    `;
  }
  // Hover styles
  menu.querySelectorAll('button').forEach(b => {
    b.addEventListener('mouseenter', () => b.style.background = '#141824');
    b.addEventListener('mouseleave', () => b.style.background = 'transparent');
  });
  document.body.appendChild(menu);
  // Click outside to close
  setTimeout(() => document.addEventListener('click', () => document.getElementById('userMenu')?.remove(), { once: true }), 0);
}
window.toggleUserMenu = toggleUserMenu;

// Hook GWS callbacks to refresh badge
window.onGwsConnected = () => { updateUserBadge(); };
window.onGwsDisconnected = () => { updateUserBadge(); };
