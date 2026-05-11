# CineFlow — Production Management Platform

> A full-featured StudioBinder-inspired film & video production management web app
> with **Google Workspace integration**, **mobile-first responsive design**,
> and **13 production modules** matching StudioBinder feature parity.
> Built as a pure static HTML/CSS/JavaScript SPA.

**Current version:** `v1.2.0` (2026-05-09)

---

## ✅ StudioBinder Feature Parity Map

| StudioBinder Category | StudioBinder Features | CineFlow Modules |
|----------------------|----------------------|------------------|
| **Write** | Screenwriting, AV Scripts, Custom docs | ✍️ Script Writer (industry-format) |
| **Breakdown** | Element Tagger, Stripboards, Sides, Reports | 📋 Breakdown · 🗂️ Stripboard · 📊 Reports |
| **Visualize** | Mood Boards, Shot Lists, Storyboards | 🎨 Moodboard · 🎬 Shot List · 🖼️ Storyboard |
| **Plan** | Contacts, Calendar, Task Boards, Media Library | 👥 Contacts · 📅 Calendar · ✅ Tasks · 📎 Media |
| **Shoot** | Call Sheets, Distribution, Analytics | 📄 Call Sheet (with Gmail send + Drive export) |

**13 modules total** covering the entire production workflow from script to wrap.

---

## Quick Links

- [What's new in v1.1](CHANGELOG.md) — Mobile UX + Google Workspace
- [How to Run](#how-to-run) — 4 ways to launch
- [Google Workspace Setup](#google-workspace-integration) — 5-minute OAuth config
- [Module Reference](#module-reference) — All 9 modules explained

---

## Table of Contents

1. [Overview](#overview)
2. [What's New in v1.1](#whats-new-in-v11)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [How to Run](#how-to-run)
6. [Google Workspace Integration](#google-workspace-integration)
7. [Architecture & Data Model](#architecture--data-model)
8. [Module Reference](#module-reference)
9. [Routing & Navigation](#routing--navigation)
10. [Responsive Design System](#responsive-design-system)
11. [LocalStorage Schema](#localstorage-schema)
12. [Adding New Features](#adding-new-features)
13. [Known Limitations](#known-limitations)
14. [Roadmap](#roadmap)

---

## Overview

**CineFlow** is a production management tool for film directors, producers, and video teams. It replicates the core workflow of StudioBinder — from writing a screenplay through to distributing call sheets on shoot day — with **deep Google Workspace integration** for team collaboration.

### Key Design Decisions

- **Zero dependencies at runtime** — Tailwind CSS via CDN, everything else is vanilla JS
- **localStorage as database** — all project data persists in the browser, no server required
- **Single-page architecture** — `index.html` is the projects dashboard; `project.html` hosts all 9 production modules via a tab switcher
- **Mobile-first responsive** — works perfectly on phones, tablets, and desktops with universal navigation patterns
- **Google Workspace ready** — Drive, Calendar, Gmail, and Docs integration built in
- **Portable** — open `index.html` directly in any browser, or serve via any static HTTP server

---

## What's New in v1.1

### 🎨 Mobile-First Universal Design

| Feature | Behavior |
|---------|----------|
| **Bottom tab bar** (mobile) | Quick access to Overview, Script, Shots, Tasks, More |
| **Hamburger drawer** | Full module navigation on mobile |
| **Bottom-sheet modals** | Slide up from bottom on mobile |
| **44px+ tap targets** | Comfortable touch interaction |
| **Safe-area insets** | Respects notched displays (iPhone X+) |

### 📋 In-App Changelog

- Bell icon in top nav opens "What's New" modal
- Red dot badge when unseen updates exist
- Auto-shows on dashboard after version bump
- Mirrors `CHANGELOG.md` content

### 🔗 Google Workspace Integration

- **One-click connect** via Settings page (5-min OAuth setup)
- **Drive** — Export full project bundle (script, shotlist, contacts, callsheet)
- **Calendar** — Sync production events with color coding
- **Gmail** — Email call sheet to crew with one click
- **Docs** — Export script as formatted Google Doc

### 🍞 Toast Notifications

Every action gets feedback: project created → "Project 'X' created", export → "Exported to Drive", error → red toast with details.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | Tailwind CSS v3 (CDN) + custom `css/styles.css` |
| Logic | Vanilla JavaScript ES6+ (no frameworks) |
| Icons | Inline SVG (heroicons style) |
| Storage | `localStorage` (browser-native, no backend) |
| OAuth | Google Identity Services (GIS) — modern replacement for `gapi.auth2` |
| APIs | Drive v3, Calendar v3, Gmail v1, Docs v1 |
| Server (optional) | Python `http.server` or Node.js `serve.js` |

---

## Project Structure

```
studiobinder-clone/
│
├── index.html              # Dashboard — project list, stats, top nav, mobile drawer
├── project.html            # Project workspace — hosts all 9 modules
│
├── css/
│   └── styles.css          # Mobile-first responsive system, all custom CSS
│
├── js/
│   ├── ui-utils.js             # Shared utilities (toast, modal, escape, formatDate, changelog data)
│   ├── google-integration.js   # Google Workspace OAuth + Drive/Calendar/Gmail/Docs/Sheets
│   ├── settings.js             # Settings modal (GWS config, data export/import)
│   ├── app.js                  # Dashboard logic — CRUD projects, filters
│   ├── project.js              # 9 core modules — script, breakdown, shots, etc.
│   └── modules-v12.js          # NEW v1.2 — Stripboard, Storyboard, Media Library, Reports
│
├── assets/                 # Reserved for future static assets
│
├── serve.js                # Tiny Node.js HTTP server (for local preview)
│
├── README.md               # ← You are here
├── CHANGELOG.md            # Version history (also visible in-app)
│
└── .claude/
    └── launch.json         # Claude Preview MCP server config
```

---

## How to Run

### Option 1 — Open directly in browser (simplest)
```bash
open /Users/narasitk/Desktop/studiobinder-clone/index.html
# Or double-click index.html in Finder/Explorer
```

> ⚠️ Some browsers block `localStorage` on `file://` URLs. If data doesn't persist, use Option 2.

### Option 2 — Node.js server (recommended)
```bash
cd /Users/narasitk/Desktop/studiobinder-clone
node serve.js
# → Open http://localhost:8899
```

> 💡 Requires Node.js. If you don't have it, use the bundled path:
> `/Users/narasitk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node serve.js`

### Option 3 — Python server
```bash
cd /Users/narasitk/Desktop/studiobinder-clone
python3 -m http.server 8899
```

### Option 4 — Any static host
Upload all files to **Netlify**, **Vercel**, **GitHub Pages**, or any CDN. Works out of the box.

> 🔒 **For Google Workspace integration to work**, you need an HTTPS or `http://localhost` URL — NOT `file://`. Production deployment must use HTTPS.

---

## Google Workspace Integration

### One-Time Setup (~5 min)

The user needs to create their own OAuth Client ID in Google Cloud Console. CineFlow will use that Client ID to authenticate via the modern Google Identity Services (GIS) flow.

#### Step-by-Step:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and sign in with your Workspace account
2. **Create a new project** (or select existing) — e.g. "CineFlow"
3. Go to **APIs & Services → Library** and enable:
   - Google Drive API
   - Google Calendar API
   - Gmail API
   - Google Docs API
4. Go to **APIs & Services → OAuth consent screen** and configure:
   - User Type: **Internal** (for Workspace org) — no verification required
   - Or **External** (for general use) — requires verification for scopes
5. Go to **APIs & Services → Credentials → + Create Credentials → OAuth Client ID**
6. Application type: **Web application**
7. Under **Authorized JavaScript origins**, add your app's URL (e.g. `http://localhost:8899` for local dev, plus your production domain)
8. Click **Create** and copy the **Client ID** (ends in `.apps.googleusercontent.com`)
9. In CineFlow, click **⚙️ Settings → OAuth Configuration** and paste the Client ID, click Save
10. Click **Sign In** to connect

### Available Features After Connecting

| Feature | Where | What it does |
|---------|-------|--------------|
| 📁 **Export to Drive** | Overview, Call Sheet | Creates folder `CineFlow — {project}` with JSON, script.txt, shotlist.csv, contacts.csv, callsheet.html |
| 📅 **Sync Calendar** | Overview, Calendar | Pushes all production events to user's primary Google Calendar with color coding |
| 📧 **Email Call Sheet** | Overview, Call Sheet | Sends formatted HTML call sheet to all contacts with emails |
| 📝 **Export to Docs** | Overview, Script | Creates Google Doc with formatted screenplay (bold scenes, centered characters, right-aligned transitions) |

### Privacy & Security

- ✅ Access tokens kept in **browser memory only** — never persisted, never sent to any third-party server
- ✅ OAuth scopes requested **on-demand** based on feature used (least privilege)
- ✅ OAuth Client ID stored in localStorage (not a secret — exposed in any client-side OAuth app)
- ✅ Disconnect button revokes the active token immediately
- ✅ All API calls go directly browser → Google (no proxy server)

### OAuth Scopes Used

| Scope | Used By |
|-------|---------|
| `drive.file` | Export project bundle (only files created by app) |
| `calendar.events` | Sync production events |
| `gmail.send` | Send call sheet emails |
| `documents` | Export script to Google Doc |
| `contacts.readonly` | (reserved for future contact import) |

---

## Architecture & Data Model

### How state flows

```
User action (click/type)
    ↓
Event handler in js/app.js or js/project.js
    ↓
updateProject(updater fn)  ← reads projects array from localStorage
    ↓                         mutates via updater fn
    ↓                         writes back to localStorage
renderModule(moduleName)   ← re-renders the relevant DOM section
    ↓
showToast("Saved")         ← user feedback
```

### Core Functions

| Function | File | Purpose |
|----------|------|---------|
| `getProjects()` / `saveProjects()` | both | Read/write projects array |
| `getProject()` | project.js | Get current project by URL `?id=` |
| `updateProject(fn)` | project.js | Mutate current project and save |
| `switchModule(mod)` | project.js | Show/hide module views + re-render + sync mobile nav |
| `renderModule(mod)` | project.js | Dispatch to correct render function |
| `showToast(msg, type)` | ui-utils.js | Toast notification |
| `escapeHtml(str)` | ui-utils.js | XSS-safe HTML escaping |
| `formatDate(d)` | ui-utils.js | Format ISO date for display |
| `gwsConnect()` | google-integration.js | OAuth sign-in |
| `gwsExportProjectToDrive()` | google-integration.js | Bundle export |
| `gwsSyncCalendarToGoogle()` | google-integration.js | Calendar sync |
| `gwsEmailCallSheet()` | google-integration.js | Send call sheet email |
| `gwsExportScriptToDoc()` | google-integration.js | Script → Google Doc |
| `showSettingsModal()` | settings.js | Open settings modal |
| `showChangelogModal()` | ui-utils.js | Open "What's New" modal |
| `seedDemoData()` | app.js | Seeds 3 demo projects on first load |

### URL Routing

```
index.html                                  # Dashboard
project.html?id=proj_demo_0                 # Project workspace (id from URL)
```

Module switching within `project.html` is in-DOM (no URL change).

---

## Module Reference

### 1. Dashboard (`index.html`)

The landing page. Lists all projects as cards with:
- Stats hero (Total / Active / Development / Completed)
- Filter buttons (All / Active / Development / Completed)
- Live search
- Project cards with color accent, type, director, status, module counters
- New Project modal with all metadata + 6-color picker
- **Mobile bottom tab bar** (Projects / New / What's New / Settings)
- **Hamburger drawer** with same items + version footer

### 2. Overview Module (in `project.html`)

Summary dashboard with:
- Project info card
- **Google Workspace Quick Actions** (when configured): Drive, Calendar, Gmail, Docs
- 4 quick-stat tiles (script lines, shots, contacts, tasks done/total)
- Production progress bar
- Pending tasks preview
- Quick Access sidebar with all modules
- Upcoming Events sidebar

### 3. Script Writer Module

Industry-format screenplay editor:

| Type | Color | Formatting | Auto-next |
|------|-------|-----------|-----------|
| `scene` | Blue | UPPERCASE, bold | `action` |
| `action` | Gray | Normal | `action` |
| `character` | Yellow | UPPERCASE, bold, centered | `dialogue` |
| `dialogue` | Green | Indented 200px | `character` |
| `parenthetical` | Purple | Italic | `action` |
| `transition` | Red | UPPERCASE, right | `action` |

**Export options:** TXT (local) | Google Docs (cloud)

### 4. Script Breakdown Module

Tags 12 element categories per scene: Cast, Extras, Props, Costume, Make-Up, VFX, SFX, Locations, Vehicles, Animals, Set Dressing, Camera. Color-coded tags.

### 5. Shot List Module

11 shot types × 6 angles × 11 movements + lens & notes. Grouped by scene. Mobile-optimized with hidden columns.

### 6. Call Sheet Module

Full builder: Production Header, Location, Scene Schedule, Cast & Crew Call Times (auto-populated from Contacts), Notes.

**Export options:** Print | Google Drive (HTML) | Gmail (send to crew)

### 7. Production Calendar

Monthly grid + flat event list. 8 event types with distinct colors. Today highlighted. Click day to add event.

**Export options:** Sync to Google Calendar (one-click)

### 8. Contacts Module

Cast & crew grouped by 11 departments. Hash-based avatar colors. Email/phone links.

### 9. Task Board (Kanban)

3 columns (To Do / In Progress / Done) with drag & drop. Priority colors, due dates. Mobile horizontal scroll.

### 10. Moodboard

Masonry grid of images (URL or upload). Hover captions. Base64 storage for uploads.

---

## Routing & Navigation

### Desktop Navigation
```
Top nav (always visible)
  ├─ CF logo + version
  ├─ Bell icon (changelog) ← red dot if unseen
  ├─ Settings gear
  ├─ New Project button
  └─ User avatar

Module nav bar (project.html only, top: 56px)
  └─ Overview / Write / Breakdown / Shot List / Call Sheet / Calendar / Contacts / Tasks / Moodboard
```

### Mobile Navigation
```
Top nav (compact)
  ├─ Hamburger (opens drawer)
  ├─ CF logo
  ├─ Bell icon
  ├─ Project status badge (project view)
  └─ Edit/New button

Bottom tab bar (always visible at bottom)
  ├─ Index page: Projects / New / What's New / Settings
  └─ Project page: Overview / Script / Shots / Tasks / More

Drawer (slides in from left)
  └─ Full navigation including all modules + app pages
```

---

## Responsive Design System

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | `< 640px` | Bottom tab bar, hamburger nav, bottom-sheet modals, single-column |
| Tablet | `641-1024px` | Hide mobile nav, no module nav bar |
| Desktop | `> 1025px` | Full top nav + module nav, multi-column layouts |

### Mobile-Specific Features

- `body { padding-bottom: 70px }` to make room for bottom tab bar
- Modals slide up from bottom (not centered) — feels native
- Larger tap targets (44px+) for buttons
- Safe-area inset support: `padding-bottom: max(6px, env(safe-area-inset-bottom))`
- Stacked grids replace multi-column layouts
- Status badges and verbose labels hidden when space is tight

### Print Stylesheet

When user prints (`window.print()` from Call Sheet):
- White background, black text
- Hides nav, tab bar, buttons
- Black/white form fields
- Single-page-friendly layout

---

## LocalStorage Schema

### Keys

| Key | Description |
|-----|-------------|
| `cf_projects` | Array of all projects (full data) |
| `cf_gws_config` | Google Workspace OAuth Client ID + last-connected timestamp |
| `cf_lastSeenVersion` | Last app version user has seen the changelog for |

### Project Object Schema

```jsonc
{
  "id": "proj_1234567890",          // unique ID (timestamp-based)
  "title": "The Last Chapter",
  "type": "Feature Film",           // Feature Film | Short Film | TV Series | Documentary | Commercial | Music Video | Web Series
  "status": "active",               // development | active | production | post | completed
  "director": "Sarah Connor",
  "startDate": "2026-05-01",
  "endDate": "2026-08-30",
  "color": "#0ea5e9",
  "createdAt": "2026-05-08T...",

  "script": [{ "type": "scene|action|character|dialogue|parenthetical|transition", "text": "..." }],
  "breakdown": { "scenes": [{ "num", "heading", "int_ext", "time", "synopsis", "elements": { "cast": [], "props": [], ... } }] },
  "shotList": [{ "id", "scene", "shot", "type", "angle", "movement", "lens", "desc", "notes" }],
  "callSheets": [{ "title", "date", "day", "director", "producer", "ad", "location", "address", "calltime", "hospital", "notes", "scenes": [...] }],
  "contacts": [{ "id", "name", "role", "dept", "email", "phone", "callTime" }],
  "tasks": { "todo": [], "inProgress": [], "done": [] },   // each task: { id, title, desc, priority, due }
  "calendar": [{ "id", "title", "date", "type", "notes" }],
  "moodboard": [{ "url", "caption" }]
}
```

### GWS Config Schema

```jsonc
{
  "clientId": "123-xxx.apps.googleusercontent.com",
  "lastConnected": 1747000000000,
  "connectedScopes": ["drive", "calendar", "gmail", "docs"]
}
```

---

## Adding New Features

### Add a new module

1. Add module nav button in `project.html` (`<button onclick="switchModule('mymod')" id="mod-mymod" class="module-btn">`)
2. Add view container `<div id="view-mymod" class="module-view hidden">`
3. Add case in `renderModule()` in `project.js`
4. Add render function `renderMyModule()`
5. Add field to schema in `seedDemoData()` and `createProject()`
6. Add bottom tab on mobile if it's frequently used

### Add new Google Workspace feature

1. Add new function in `js/google-integration.js`, e.g. `gwsMyFeature(project)`
2. Use `await ensureConnected(['drive'])` to gate the call
3. Use `gwsApiFetch(url, options)` for API calls (auto-adds Bearer token)
4. Call `showToast()` for feedback
5. Add a button in the relevant module's render function calling `gwsMyFeature(getProject())`

### Add a new toast type

```js
showToast('Custom message', 'success');   // success | error | info | warning
```

### Add new changelog entry

Edit the `CHANGELOG` array in `js/ui-utils.js`:
```js
{
  version: '1.2.0',
  date: '2026-XX-XX',
  title: 'Your title',
  sections: [
    { title: '✨ New Features', items: ['...'] }
  ]
}
```

Also update `APP_VERSION` constant at the top of the same file. Update `CHANGELOG.md`.

---

## Known Limitations

| Limitation | Notes |
|-----------|-------|
| localStorage only (default) | ~5–10MB limit per origin, browser-local only |
| No real-time collab | No WebSocket / multi-user editing |
| Single call sheet | Only `callSheets[0]` is used currently |
| No script import | Can't import `.fdx` / `.fountain` files yet |
| OAuth requires HTTPS | GWS doesn't work on `file://` URLs |
| Moodboard size | Base64 uploads can fill localStorage fast |

---

## Roadmap

### v1.2 (planned)
- [ ] **Stripboard view** — drag-and-drop scene ordering
- [ ] **PDF export** — call sheet, shot list, script via browser print API
- [ ] **Multi-day call sheets** — array of call sheet objects with day picker
- [ ] **AV Script / Two-column format** — for commercials and docs
- [ ] **Storyboard module** — sketch/upload frames per shot
- [ ] **Import contacts from Google Contacts**

### v1.3 (planned)
- [ ] **Cloud sync** — Supabase backend option for cross-device
- [ ] **Team collaboration** — share project link, real-time edits
- [ ] **Scene report** — breakdown summary by category across all scenes
- [ ] **Mobile PWA** — service worker + manifest for install-to-homescreen
- [ ] **Keyboard shortcuts** — Cmd+S, Cmd+K command palette

### v2.0 (vision)
- [ ] **AI features** — auto-tag breakdown elements, shot suggestions, scheduling optimizer
- [ ] **Real-time crew chat** — integrated with Slack/Gmail
- [ ] **Mobile native apps** — Capacitor wrapper for iOS/Android

---

## License

MIT — Free to fork, modify, and use commercially.

---

## Credits

- Inspired by [StudioBinder](https://www.studiobinder.com/)
- Icons from [Heroicons](https://heroicons.com/) (inline SVG)
- Built with [Tailwind CSS](https://tailwindcss.com/)
- Auth powered by [Google Identity Services](https://developers.google.com/identity/gsi/web)
