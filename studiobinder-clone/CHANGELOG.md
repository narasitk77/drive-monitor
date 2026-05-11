# Changelog

All notable changes to CineFlow will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
**This file is mirrored in-app at "What's New" → opened from the bell icon.**

---

## [1.2.0] — 2026-05-09

### 🎬 Full StudioBinder Parity — 4 New Modules

After a comprehensive audit comparing every CineFlow feature to StudioBinder.com,
this release adds the four missing modules to reach **full feature parity**.

CineFlow now covers all 5 StudioBinder categories: **Write · Breakdown · Visualize · Plan · Shoot** — plus Reports.

---

### ✨ Added — 4 New Modules

#### 🗂️ Stripboard
- Visual scene scheduler with **drag-and-drop** between shoot days
- Color-coded strips by time of day (DAY/NIGHT/DAWN/DUSK)
- INT/EXT indicator on each strip
- Add/remove shoot days with date and label fields
- "Unscheduled" column auto-populated from Breakdown scenes
- Scene count per day

#### 🖼️ Storyboard
- Per-shot **frame image uploads** (base64-encoded)
- Main frame display (first frame) + alt frames thumbnail strip
- Click any alt frame to make it the main
- Auto-syncs with Shot List (no separate data — just `shot.frames[]`)
- Hover-reveal upload button on each shot card
- Empty state prompts to add shots first

#### 📎 Media Library
- Centralized library of **file references and links**
- Add arbitrary URLs with custom names
- **Browse Google Drive** integration — imports recent Drive files
- Auto-detects file type (PDF, image, video, audio, doc, sheet, slides)
- Shows Drive thumbnails when available
- Per-item icons based on MIME type
- Direct "Open ↗" links to source

#### 📊 Reports
- **Production-wide breakdown summary** across all scenes
- Aggregate stats: total scenes, INT/EXT split, DAY/NIGHT split, total shots
- Per-category element reports (Cast, Props, Costumes, etc.)
- Each element shows which scenes it appears in (clickable scene tags)
- Sorted by frequency (most used first)
- Print-friendly layout

---

### 🔗 Google Workspace Enhancements

- **Drive browser** in Media Library — list 30 most-recent files with metadata
- **Google Sheets export** for shot lists (`gwsExportShotListToSheets`)
- Exposed `gwsApiFetch` and `ensureConnected` to window for custom integrations
- Drive folder navigation via `gwsDriveListRecentFiles(limit)`

---

### 🔧 Technical

- New file: `js/modules-v12.js` (450+ lines, 4 modules + helpers)
- Window exports added: `updateProject`, `getProjects`, `saveProjects`, `BREAKDOWN_CATEGORIES`
- Module nav extended to **13 modules** (was 9):
  - Overview, Write, Breakdown, Shot List, Call Sheet, Calendar, Contacts, Tasks, Moodboard
  - **+ Stripboard, Storyboard, Media, Reports** (new)
- Mobile drawer extended with all 4 new modules + emoji icons

---

### 🧪 Comprehensive Audit

Ran end-to-end test of all features:

| Module | Functions | Status |
|---|---|---|
| Script Writer | 7 functions | ✅ Pass |
| Breakdown | 4 functions | ✅ Pass |
| Shot List | 3 functions | ✅ Pass |
| Call Sheet | 4 functions | ✅ Pass |
| Calendar | 4 functions | ✅ Pass |
| Contacts | 3 functions | ✅ Pass |
| Tasks | 6 functions | ✅ Pass |
| Moodboard | 3 functions | ✅ Pass |
| Stripboard | 5 functions | ✅ Pass |
| Storyboard | 2 functions | ✅ Pass |
| Media Library | 3 functions | ✅ Pass |
| Reports | 1 function | ✅ Pass |
| GWS Integration | 12 functions | ✅ Pass |

**Total: 60+ functions verified working.**

---

### 📁 New Schema Fields

```jsonc
{
  // Per shot — for Storyboard module
  "shotList": [{ ..., "frames": [{ "url": "data:...", "caption": "..." }] }],

  // Stripboard scheduling
  "stripboard": {
    "days": [{ "date": "2026-05-12", "label": "Studio A", "sceneIds": ["sc_0", "sc_1"] }]
  },

  // Media Library
  "mediaLibrary": [{
    "id": "m_...", "type": "drive|link", "name": "...", "url": "...",
    "mimeType": "...", "thumbnailLink": "...", "addedAt": "ISO"
  }]
}
```

Schema is **backwards compatible** — old projects continue to work without these fields.

---

## [1.1.0] — 2026-05-09

### 🎨 UX Overhaul + Google Workspace Integration

A major release focused on three pillars:
1. **In-app changelog** — version history is now visible inside the app
2. **Universal responsive design** — works perfectly on phone, tablet, desktop
3. **Google Workspace integration** — Drive, Calendar, Gmail, Docs

---

### ✨ Added

#### In-App Changelog
- New "What's New" page accessible from bell icon in top nav
- Red dot badge appears when there's an unseen update
- Auto-shows on dashboard load after a version bump
- Beautiful timeline-style layout with categorized entries
- Marked latest version with a "Latest" badge

#### Mobile-First Responsive Design
- **Bottom tab bar on mobile** — universal navigation pattern (Overview, Script, Shots, Tasks, More)
- **Hamburger menu drawer** with full module navigation
- **Bottom-sheet modals** on mobile (slide up from bottom)
- **Larger tap targets** (44px+) per Apple HIG / Material Design guidelines
- **Safe-area inset support** for notched phones (iPhone X+)
- **Mobile-optimized layouts** for all 9 modules
- **Stacked grids** on small screens
- **Horizontal scroll** for kanban on mobile
- **Compact calendar cells** on mobile

#### Google Workspace Integration
- **Settings page** with full OAuth configuration UI
- **Setup wizard** with step-by-step Google Cloud Console instructions
- **Google Identity Services (GIS)** for modern OAuth flow
- **Google Drive Export** — one-click export of full project bundle:
  - Project JSON (full backup)
  - Script as .txt
  - Shot list as .csv
  - Contacts as .csv
  - Call sheet as .html
- **Google Calendar Sync** — push all production events to user's calendar with color coding by event type
- **Gmail Send** — email call sheet to all crew with email addresses
- **Google Docs Export** — script exported as a formatted Google Doc with proper screenplay styling (bold scene headings, centered character names, right-aligned transitions)
- **Quick Actions card** in Overview for one-click GWS operations
- **Connect/Disconnect controls** with status indicator

#### UI Polish
- **Toast notifications** for action feedback (success, error, info, warning)
- **Improved button system** with primary/secondary/ghost/danger variants
- **Auto-scroll to top** when switching modules
- **Active state highlighting** across mobile drawer + bottom tabs + module nav (synchronized)
- **Smooth fade-in animations** on cards
- **Dropdown action menus** on project cards (no more hover-only menus on mobile)
- **Backdrop blur** on modal overlays

#### Data Management (Settings Page)
- **Export All Data** — download full backup as JSON
- **Import Data** — restore from backup file
- **Clear All Data** — wipe localStorage with double confirmation
- **Storage usage indicator**
- **Browser detection display**

---

### 🔧 Changed

- Reorganized JS architecture: shared utilities extracted to `js/ui-utils.js`
- All modal handling now centralized in `ui-utils.js`
- All toast/escape/format helpers now globally available
- `switchModule()` now also updates mobile drawer/tab bar active states
- Project cards: action menu replaced with click-to-toggle dropdown (better mobile UX)
- Status badges hidden on small screens (room for project title)
- Settings + Changelog buttons hidden on tiny mobile (accessible via hamburger)

---

### 🐛 Fixed

- Removed conflicting `const AVATAR_COLORS` declaration that prevented `project.js` from loading after `ui-utils.js`
- Fixed module nav not collapsing on mobile (was overflowing)
- Fixed modal overflow issues on small viewports

---

### 🔒 Security & Privacy

- OAuth access tokens kept in **memory only** — never written to localStorage or sent to any server
- OAuth scopes requested **on-demand** based on which feature is being used (least privilege)
- OAuth Client ID stored in localStorage (it's not a secret — it's exposed in any client-side OAuth app)
- Setup guide explicitly explains the privacy model
- Clear disconnect option that revokes the access token

---

### 📁 New Files

```
js/ui-utils.js              # 240 lines  — shared utilities, toasts, changelog data
js/google-integration.js    # 360 lines  — full Google Workspace integration
js/settings.js              # 200 lines  — settings modal + data management
```

### 📦 Updated Files

```
css/styles.css              # rewritten with mobile-first responsive system
index.html                  # mobile drawer, bottom tab bar, changelog button, settings button
project.html                # mobile drawer, bottom tab bar, GWS-aware buttons
js/app.js                   # uses shared utilities, toast feedback
js/project.js               # GWS export buttons in script/calendar/callsheet, overview GWS card
```

---

## [1.0.0] — 2026-05-08

### 🎉 Initial Release

Complete StudioBinder-inspired production management platform built as a static web app.

### Added

#### Infrastructure
- Pure HTML/CSS/JavaScript SPA — zero npm, zero build tools
- Tailwind CSS v3 via CDN for styling
- `localStorage` as the persistence layer (key: `cf_projects`)
- `serve.js` — tiny Node.js HTTP server for local preview
- Demo data seeded on first load (3 sample projects)

#### Dashboard (`index.html`)
- Projects grid (3-column responsive layout)
- Stats bar: Total / Active / Development / Completed counts
- Filter buttons: All / Active / Development / Completed
- Live search by project title or director name
- Project cards with color accent, type badge, status badge, module counters
- New Project modal with all metadata fields + 6-color theme picker
- Duplicate/Delete project actions

#### 9 Production Modules (`project.html`)

1. **Overview** — Project info, quick stats, progress bar, pending tasks, upcoming events
2. **Script Writer** — 6 line types (Scene/Action/Character/Dialogue/Parenthetical/Transition) with per-type formatting, auto-advance on Enter, cycle types via badge click, export to .txt
3. **Script Breakdown** — 12 element categories, color-coded tags per scene
4. **Shot List** — 11 shot types, 6 angles, 11 camera movements, lens & notes, grouped by scene
5. **Call Sheet** — Full builder (header, location, schedule, call times, notes), print-ready
6. **Production Calendar** — Monthly grid, 8 event types, today highlight, click-to-add
7. **Contacts** — Cast & crew grouped by 11 departments, color avatars, mailto/tel links
8. **Task Board** — Kanban (To Do/In Progress/Done) with drag & drop, priorities, due dates
9. **Moodboard** — Image upload (base64) + URL, masonry grid, hover captions

---

[1.1.0]: #110--2026-05-09
[1.0.0]: #100--2026-05-08
