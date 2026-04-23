import os
import json
import time
import datetime
from flask import Flask, render_template, jsonify, redirect, request, session, url_for
from werkzeug.middleware.proxy_fix import ProxyFix
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  # for reverse proxy / Docker

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    # Dev fallback — sessions reset on restart; set SECRET_KEY in production
    SECRET_KEY = os.urandom(24)
app.secret_key = SECRET_KEY

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
DATA_DIR = os.environ.get("DATA_DIR", ".")  # override via env for Docker volume
CREDENTIALS_FILE = os.path.join(DATA_DIR, "credentials.json")
TOKEN_FILE = os.path.join(DATA_DIR, "token.json")
CHANGE_TOKENS_FILE = os.path.join(DATA_DIR, "change_tokens.json")

TARGET_DRIVE_NAMES = ["Video 2026", "Production Team"]
FINAL_VIDEO_FOLDER_ID = "1HXvXzXlgOhZcdhjK7XagHJe2-HbfxTrb"
FINAL_VIDEO_LABEL = "Final Video"

# In-memory caches
_folder_cache = {}          # {drive_id: {"folders": {...}, "expires": ts}}
_change_tokens = {}         # {drive_id: page_token}  — backed by CHANGE_TOKENS_FILE
_single_parent_cache = {}
FOLDER_CACHE_TTL = 600


# ─── Persistence helpers ────────────────────────────────────────────────────────

def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def load_change_tokens():
    try:
        with open(CHANGE_TOKENS_FILE) as f:
            return json.load(f)
    except Exception:
        return {}

def save_change_tokens():
    _ensure_data_dir()
    with open(CHANGE_TOKENS_FILE, "w") as f:
        json.dump(_change_tokens, f)


# ─── Auth ───────────────────────────────────────────────────────────────────────

def load_credentials():
    if not os.path.exists(TOKEN_FILE):
        return None
    try:
        with open(TOKEN_FILE) as f:
            info = json.load(f)
        creds = Credentials.from_authorized_user_info(info, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            _save_credentials(creds)
        return creds if creds.valid else None
    except Exception:
        return None

def _save_credentials(creds):
    _ensure_data_dir()
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())

def get_service():
    creds = load_credentials()
    return build("drive", "v3", credentials=creds) if creds else None


# ─── Folder map ─────────────────────────────────────────────────────────────────

def build_folder_map(service, drive_id):
    cached = _folder_cache.get(drive_id)
    if cached and time.time() < cached["expires"]:
        return cached["folders"]

    folder_map = {}
    page_token = None
    while True:
        result = service.files().list(
            corpora="drive", driveId=drive_id,
            includeItemsFromAllDrives=True, supportsAllDrives=True,
            q="mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="nextPageToken,files(id,name,parents)",
            pageSize=1000, pageToken=page_token,
        ).execute()
        for folder in result.get("files", []):
            folder_map[folder["id"]] = {"name": folder["name"], "parents": folder.get("parents", [])}
        page_token = result.get("nextPageToken")
        if not page_token:
            break

    _folder_cache[drive_id] = {"folders": folder_map, "expires": time.time() + FOLDER_CACHE_TTL}
    return folder_map


def resolve_path(folder_map, parent_ids, drive_id, _visited=None):
    if _visited is None:
        _visited = set()
    if not parent_ids:
        return []
    pid = parent_ids[0]
    if pid == drive_id or pid in _visited:
        return []
    _visited.add(pid)
    folder = folder_map.get(pid)
    if not folder:
        return []
    return resolve_path(folder_map, folder.get("parents", []), drive_id, _visited) + [folder["name"]]


def classify_path(path_parts):
    outlet = path_parts[0] if path_parts else "ไม่ระบุ"
    media_type = "อื่นๆ"
    for part in path_parts:
        pl = part.lower()
        if "footage" in pl:   media_type = "Footage"; break
        if "audio"   in pl:   media_type = "Audio";   break
        if "graphic" in pl:   media_type = "Graphic"; break
        if "script"  in pl:   media_type = "Script";  break
        if "final"   in pl:   media_type = "Final";   break
    return outlet, media_type


def enrich(f, path_parts, drive_name):
    outlet, media_type = classify_path(path_parts)
    return {
        "id":           f["id"],
        "name":         f["name"],
        "drive":        drive_name,
        "outlet":       outlet,
        "type":         media_type,
        "path":         " › ".join(path_parts) if path_parts else "(root)",
        "createdTime":  f.get("createdTime", ""),
        "modifiedTime": f.get("modifiedTime", ""),
        "link":         f.get("webViewLink", ""),
        "mimeType":     f.get("mimeType", ""),
        "size":         int(f.get("size", 0)) if f.get("size") else 0,
    }


# ─── Changes API (detects moves) ────────────────────────────────────────────────

def _ensure_change_token(service, drive_id):
    """Make sure we have a page token for this drive (load from file or create fresh)."""
    if drive_id in _change_tokens:
        return
    stored = load_change_tokens()
    if drive_id in stored:
        _change_tokens[drive_id] = stored[drive_id]
        return
    # First run: get a start token (captures future changes from this point on)
    result = service.changes().getStartPageToken(
        driveId=drive_id, supportsAllDrives=True
    ).execute()
    _change_tokens[drive_id] = result["startPageToken"]
    save_change_tokens()


def poll_drive_changes(service, drive_id):
    """
    Poll the Changes API for this drive.
    Returns list of raw file dicts for files that were ADDED or MOVED into the drive
    since the last poll. Updates the stored page token.
    """
    _ensure_change_token(service, drive_id)
    token = _change_tokens[drive_id]
    changed_files = []

    while True:
        result = service.changes().list(
            pageToken=token,
            driveId=drive_id,
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            includeRemoved=False,
            spaces="drive",
            fields=(
                "nextPageToken,newStartPageToken,"
                "changes(changeType,file(id,name,parents,createdTime,"
                "modifiedTime,webViewLink,mimeType,size,trashed))"
            ),
            pageSize=100,
        ).execute()

        for change in result.get("changes", []):
            if change.get("changeType") == "file" and "file" in change:
                f = change["file"]
                if not f.get("trashed"):
                    changed_files.append(f)

        next_token = result.get("nextPageToken")
        new_start  = result.get("newStartPageToken")

        if new_start:
            _change_tokens[drive_id] = new_start
            save_change_tokens()

        if not next_token:
            break
        token = next_token

    return changed_files


# ─── File fetching ──────────────────────────────────────────────────────────────

def fetch_from_drive(service, drive, hours):
    """Fetch recently added/modified files AND changed (moved) files from a shared drive."""
    drive_id   = drive["id"]
    drive_name = drive["name"]
    folder_map = build_folder_map(service, drive_id)

    cutoff = (datetime.datetime.utcnow() - datetime.timedelta(hours=hours)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    # 1. Time-based query: new uploads + modified files
    time_files = []
    page_token = None
    while True:
        result = service.files().list(
            corpora="drive", driveId=drive_id,
            includeItemsFromAllDrives=True, supportsAllDrives=True,
            orderBy="modifiedTime desc", pageSize=200,
            fields="nextPageToken,files(id,name,createdTime,modifiedTime,parents,webViewLink,mimeType,size)",
            q=(
                f"mimeType != 'application/vnd.google-apps.folder' and trashed=false "
                f"and (createdTime > '{cutoff}' or modifiedTime > '{cutoff}')"
            ),
            pageToken=page_token,
        ).execute()
        time_files.extend(result.get("files", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            break

    # 2. Changes API: catches moves (even if timestamps didn't change)
    moved_files = poll_drive_changes(service, drive_id)

    # 3. Merge — Changes API results take priority (fresher metadata)
    seen = {}
    for f in moved_files:
        seen[f["id"]] = f
    for f in time_files:
        if f["id"] not in seen:
            seen[f["id"]] = f

    # 4. Enrich with path info
    results = []
    for f in seen.values():
        path_parts = resolve_path(folder_map, f.get("parents", []), drive_id)
        results.append(enrich(f, path_parts, drive_name))

    return results


def _resolve_single_parent(service, parent_ids, stop_id):
    if not parent_ids:
        return ""
    pid = parent_ids[0]
    if pid == stop_id:
        return ""
    if pid in _single_parent_cache:
        return _single_parent_cache[pid]
    try:
        f = service.files().get(fileId=pid, supportsAllDrives=True, fields="id,name").execute()
        name = f.get("name", "")
        _single_parent_cache[pid] = name
        return name
    except Exception:
        return ""


def fetch_from_folder(service, folder_id, label):
    """Fetch all files directly inside a specific folder."""
    files = []
    page_token = None
    while True:
        result = service.files().list(
            corpora="allDrives",
            includeItemsFromAllDrives=True, supportsAllDrives=True,
            orderBy="modifiedTime desc", pageSize=200,
            fields="nextPageToken,files(id,name,createdTime,modifiedTime,parents,webViewLink,mimeType,size)",
            q=f"'{folder_id}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'",
            pageToken=page_token,
        ).execute()
        for f in result.get("files", []):
            parent_name = _resolve_single_parent(service, f.get("parents", []), folder_id)
            path_parts = [parent_name] if parent_name else []
            files.append(enrich(f, path_parts, label))
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return files


# ─── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html", authenticated=load_credentials() is not None)


@app.route("/auth/login")
def auth_login():
    if not os.path.exists(CREDENTIALS_FILE):
        return "ไม่พบไฟล์ credentials.json — กรุณาดูขั้นตอนการตั้งค่า", 500
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE, scopes=SCOPES,
        redirect_uri=url_for("auth_callback", _external=True),
    )
    auth_url, state = flow.authorization_url(access_type="offline", prompt="consent")
    session["oauth_state"]    = state
    session["code_verifier"]  = flow.code_verifier
    return redirect(auth_url)


@app.route("/auth/callback")
def auth_callback():
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE, scopes=SCOPES,
        redirect_uri=url_for("auth_callback", _external=True),
        state=session.get("oauth_state"),
    )
    flow.code_verifier = session.get("code_verifier")
    flow.fetch_token(authorization_response=request.url)
    _save_credentials(flow.credentials)
    return redirect(url_for("index"))


@app.route("/auth/logout")
def auth_logout():
    for f in [TOKEN_FILE]:
        if os.path.exists(f):
            os.remove(f)
    _folder_cache.clear()
    _single_parent_cache.clear()
    return redirect(url_for("index"))


@app.route("/api/files")
def api_files():
    service = get_service()
    if not service:
        return jsonify({"error": "not_authenticated"}), 401

    hours  = int(request.args.get("hours", 72))
    source = request.args.get("source", "")

    try:
        all_files = []

        if source != FINAL_VIDEO_LABEL:
            drives_result = service.drives().list(pageSize=100).execute()
            all_drives    = drives_result.get("drives", [])
            target_drives = [d for d in all_drives if d["name"] in TARGET_DRIVE_NAMES]

            for drive in target_drives:
                if source and drive["name"] != source:
                    continue
                all_files.extend(fetch_from_drive(service, drive, hours=hours))

        if not source or source == FINAL_VIDEO_LABEL:
            all_files.extend(fetch_from_folder(service, FINAL_VIDEO_FOLDER_ID, FINAL_VIDEO_LABEL))

        # Sort by most-recent activity (max of createdTime / modifiedTime)
        all_files.sort(
            key=lambda x: max(x.get("modifiedTime", ""), x.get("createdTime", "")),
            reverse=True,
        )

        return jsonify({
            "files": all_files,
            "total": len(all_files),
            "lastUpdated": datetime.datetime.utcnow().isoformat() + "Z",
        })

    except HttpError as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/refresh-cache", methods=["POST"])
def refresh_cache():
    _folder_cache.clear()
    _single_parent_cache.clear()
    _change_tokens.clear()          # force re-init of change tokens on next poll
    return jsonify({"ok": True})


@app.route("/api/changelog")
def api_changelog():
    try:
        cl_path = os.path.join(os.path.dirname(__file__), "changelog.json")
        with open(cl_path) as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])


if __name__ == "__main__":
    os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
    app.run(debug=True, port=5001, host="0.0.0.0")
