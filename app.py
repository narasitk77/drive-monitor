import os
import json
import time
import datetime
import functools
from flask import Flask, render_template, jsonify, redirect, request, session, url_for
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", os.urandom(24))

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.json"

TARGET_DRIVE_NAMES = ["Video 2026", "Production Team"]

# Specific folder to monitor as a separate source
FINAL_VIDEO_FOLDER_ID = "1HXvXzXlgOhZcdhjK7XagHJe2-HbfxTrb"
FINAL_VIDEO_LABEL = "Final Video"

# In-memory folder cache: {drive_id: {"folders": {...}, "expires": timestamp}}
_folder_cache = {}
FOLDER_CACHE_TTL = 600  # 10 minutes


# ─── Auth ──────────────────────────────────────────────────────────────────────

def load_credentials():
    if not os.path.exists(TOKEN_FILE):
        return None
    try:
        with open(TOKEN_FILE) as f:
            info = json.load(f)
        creds = Credentials.from_authorized_user_info(info, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            save_credentials(creds)
        return creds if creds.valid else None
    except Exception:
        return None


def save_credentials(creds):
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())


def get_service():
    creds = load_credentials()
    if not creds:
        return None
    return build("drive", "v3", credentials=creds)


# ─── Drive helpers ─────────────────────────────────────────────────────────────

def build_folder_map(service, drive_id):
    """Fetch all folders in a shared drive. Cached."""
    cached = _folder_cache.get(drive_id)
    if cached and time.time() < cached["expires"]:
        return cached["folders"]

    folder_map = {}
    page_token = None
    while True:
        result = service.files().list(
            corpora="drive",
            driveId=drive_id,
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            q="mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="nextPageToken,files(id,name,parents)",
            pageSize=1000,
            pageToken=page_token,
        ).execute()
        for folder in result.get("files", []):
            folder_map[folder["id"]] = {
                "name": folder["name"],
                "parents": folder.get("parents", []),
            }
        page_token = result.get("nextPageToken")
        if not page_token:
            break

    _folder_cache[drive_id] = {"folders": folder_map, "expires": time.time() + FOLDER_CACHE_TTL}
    return folder_map


def resolve_path(folder_map, parent_ids, drive_id, _visited=None):
    """Return list of folder names from drive root down to the parent."""
    if _visited is None:
        _visited = set()
    if not parent_ids:
        return []
    parent_id = parent_ids[0]
    if parent_id == drive_id or parent_id in _visited:
        return []
    _visited.add(parent_id)
    folder = folder_map.get(parent_id)
    if not folder:
        return []
    ancestor = resolve_path(folder_map, folder.get("parents", []), drive_id, _visited)
    return ancestor + [folder["name"]]


def classify_path(path_parts):
    outlet = path_parts[0] if path_parts else "ไม่ระบุ"
    media_type = "อื่นๆ"
    for part in path_parts:
        pl = part.lower()
        if "footage" in pl:
            media_type = "Footage"; break
        if "audio" in pl:
            media_type = "Audio"; break
        if "graphic" in pl or "กราฟิก" in pl:
            media_type = "Graphic"; break
        if "script" in pl or "สคริปต์" in pl:
            media_type = "Script"; break
        if "final" in pl:
            media_type = "Final"; break
    return outlet, media_type


def enrich(f, path_parts, drive_name):
    outlet, media_type = classify_path(path_parts)
    return {
        "id": f["id"],
        "name": f["name"],
        "drive": drive_name,
        "outlet": outlet,
        "type": media_type,
        "path": " › ".join(path_parts) if path_parts else "(root)",
        "createdTime": f.get("createdTime", ""),
        "modifiedTime": f.get("modifiedTime", ""),
        "link": f.get("webViewLink", ""),
        "mimeType": f.get("mimeType", ""),
        "size": int(f.get("size", 0)) if f.get("size") else 0,
    }


def fetch_from_drive(service, drive, hours):
    """Fetch recently created OR modified files from a shared drive."""
    drive_id = drive["id"]
    drive_name = drive["name"]
    folder_map = build_folder_map(service, drive_id)

    cutoff = (datetime.datetime.utcnow() - datetime.timedelta(hours=hours)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    # Include files that were CREATED or MODIFIED in the window — catches moved files
    query = (
        f"mimeType != 'application/vnd.google-apps.folder' "
        f"and trashed=false "
        f"and (createdTime > '{cutoff}' or modifiedTime > '{cutoff}')"
    )

    files = []
    page_token = None
    while True:
        result = service.files().list(
            corpora="drive",
            driveId=drive_id,
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            orderBy="modifiedTime desc",
            pageSize=200,
            fields="nextPageToken,files(id,name,createdTime,modifiedTime,parents,webViewLink,mimeType,size)",
            q=query,
            pageToken=page_token,
        ).execute()

        for f in result.get("files", []):
            path_parts = resolve_path(folder_map, f.get("parents", []), drive_id)
            files.append(enrich(f, path_parts, drive_name))

        page_token = result.get("nextPageToken")
        if not page_token:
            break

    return files


def fetch_from_folder(service, folder_id, label):
    """Fetch all files directly inside a specific folder (non-drive)."""
    # Build a local folder cache for path resolution within this folder tree
    query = f"'{folder_id}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'"
    files = []
    page_token = None
    while True:
        result = service.files().list(
            corpora="allDrives",
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            orderBy="modifiedTime desc",
            pageSize=200,
            fields="nextPageToken,files(id,name,createdTime,modifiedTime,parents,webViewLink,mimeType,size)",
            q=query,
            pageToken=page_token,
        ).execute()

        for f in result.get("files", []):
            # For the Final Video folder, treat each file's parent subfolder as the outlet
            parent_name = _resolve_single_parent(service, f.get("parents", []), folder_id)
            path_parts = [parent_name] if parent_name else []
            files.append(enrich(f, path_parts, label))

        page_token = result.get("nextPageToken")
        if not page_token:
            break

    return files


_single_parent_cache = {}

def _resolve_single_parent(service, parent_ids, stop_id):
    """Resolve immediate parent folder name, stopping at stop_id."""
    if not parent_ids:
        return ""
    pid = parent_ids[0]
    if pid == stop_id:
        return ""
    if pid in _single_parent_cache:
        return _single_parent_cache[pid]
    try:
        f = service.files().get(
            fileId=pid,
            supportsAllDrives=True,
            fields="id,name,parents"
        ).execute()
        name = f.get("name", "")
        _single_parent_cache[pid] = name
        return name
    except Exception:
        return ""


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    authenticated = load_credentials() is not None
    return render_template("index.html", authenticated=authenticated)


@app.route("/auth/login")
def auth_login():
    if not os.path.exists(CREDENTIALS_FILE):
        return "ไม่พบไฟล์ credentials.json — กรุณาดูขั้นตอนการตั้งค่า", 500
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri=url_for("auth_callback", _external=True),
    )
    auth_url, state = flow.authorization_url(access_type="offline", prompt="consent")
    session["oauth_state"] = state
    session["code_verifier"] = flow.code_verifier
    return redirect(auth_url)


@app.route("/auth/callback")
def auth_callback():
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri=url_for("auth_callback", _external=True),
        state=session.get("oauth_state"),
    )
    flow.code_verifier = session.get("code_verifier")
    flow.fetch_token(authorization_response=request.url)
    save_credentials(flow.credentials)
    return redirect(url_for("index"))


@app.route("/auth/logout")
def auth_logout():
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
    _folder_cache.clear()
    _single_parent_cache.clear()
    return redirect(url_for("index"))


@app.route("/api/files")
def api_files():
    service = get_service()
    if not service:
        return jsonify({"error": "not_authenticated"}), 401

    hours = int(request.args.get("hours", 72))
    source = request.args.get("source", "")  # "", "Video 2026", "Production Team", "Final Video"

    try:
        all_files = []

        if source != FINAL_VIDEO_LABEL:
            # Fetch from shared drives
            drives_result = service.drives().list(pageSize=100).execute()
            all_drives = drives_result.get("drives", [])
            target_drives = [d for d in all_drives if d["name"] in TARGET_DRIVE_NAMES]

            for drive in target_drives:
                if source and drive["name"] != source:
                    continue
                files = fetch_from_drive(service, drive, hours=hours)
                all_files.extend(files)

        if not source or source == FINAL_VIDEO_LABEL:
            # Fetch from Final Video folder
            final_files = fetch_from_folder(service, FINAL_VIDEO_FOLDER_ID, FINAL_VIDEO_LABEL)
            all_files.extend(final_files)

        # Sort by modifiedTime desc (catches moved files) then createdTime desc
        all_files.sort(
            key=lambda x: max(x.get("modifiedTime", ""), x.get("createdTime", "")),
            reverse=True
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
    return jsonify({"ok": True})


@app.route("/api/changelog")
def api_changelog():
    try:
        with open("changelog.json") as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])


if __name__ == "__main__":
    os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
    app.run(debug=True, port=5001)
