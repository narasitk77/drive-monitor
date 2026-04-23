# Drive Monitor — Video 2026

หน้าเว็บสำหรับติดตามไฟล์ที่อัพโหลดหรือย้ายเข้า Google Drive Shared Drive แบบ real-time

![Python](https://img.shields.io/badge/Python-3.9+-blue) ![Flask](https://img.shields.io/badge/Flask-3.x-lightgrey) ![Google Drive API](https://img.shields.io/badge/Google%20Drive%20API-v3-green)

## ฟีเจอร์

- **Outlet-first view** — แสดงโฟลเดอร์ outlet ก่อน กดขยายเพื่อดูไฟล์ข้างใน
- **Drive tabs** — สลับดูระหว่าง Video 2026 / Production Team / Final Video / ทั้งหมด
- **ตรวจจับไฟล์ที่ย้าย** — ใช้ทั้ง `createdTime` และ `modifiedTime` เพื่อจับไฟล์ที่ย้ายเข้ามา
- **badge NEW / MOVED** — ไฮไลต์ไฟล์ที่เพิ่งเข้ามาหรือถูกย้ายภายใน 1 ชั่วโมง
- **Auto-refresh** ทุก 2 นาที พร้อม countdown timer
- **Filter** ตามช่วงเวลา (24h / 48h / 72h / 7d) และค้นหาชื่อไฟล์/outlet
- **Changelog** บนเว็บ — ดูประวัติการอัพเดทได้ในหน้าเดียวกัน
- Folder cache 10 นาที เพื่อลด Google API calls

## Shared Drives ที่ติดตาม

| Drive | ประเภท |
|-------|--------|
| Video 2026 | Shared Drive — outlet subfolders (NEWS, POP, KND, THE SECRET SAUCE, …) |
| Production Team | Shared Drive |
| Final Video | Specific folder (ID: `1HXvXzXlgOhZcdhjK7XagHJe2-HbfxTrb`) |

## การติดตั้ง

### 1. สร้าง Google OAuth Credentials

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง Project ใหม่ หรือเลือก project ที่มีอยู่
3. เปิดใช้งาน **Google Drive API** (APIs & Services → Enable APIs)
4. ไปที่ **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. เพิ่ม Authorized redirect URI:
   ```
   http://localhost:5001/auth/callback
   ```
7. ดาวน์โหลด JSON แล้วบันทึกเป็น `credentials.json` ในโฟลเดอร์นี้

### 2. ติดตั้ง dependencies

```bash
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

### 3. รัน server

```bash
OAUTHLIB_INSECURE_TRANSPORT=1 python app.py
```

### 4. เปิดเบราว์เซอร์

ไปที่ `http://localhost:5001` แล้วกด **เข้าสู่ระบบด้วย Google**

## โครงสร้างไฟล์

```
Google Drive Project/
├── app.py                  # Flask backend + Google Drive API
├── templates/
│   └── index.html          # Frontend (single page)
├── requirements.txt
├── changelog.json          # ข้อมูล changelog สำหรับแสดงบนเว็บ
├── credentials.json        # ← ต้องสร้างเอง (ไม่อยู่ใน repo)
├── token.json              # ← สร้างอัตโนมัติหลัง login
└── .gitignore
```

## การเพิ่ม Outlet ใหม่

ระบบตรวจจับ outlet อัตโนมัติจากโฟลเดอร์ระดับแรกใน Shared Drive ไม่ต้องกำหนดรายชื่อล่วงหน้า

## การอัพเดท Changelog

แก้ไขไฟล์ `changelog.json` แล้วรีเฟรชหน้าเว็บ — ไม่ต้อง restart server

## หมายเหตุ

- `credentials.json` และ `token.json` ถูก gitignore ไว้แล้ว ไม่ควร commit
- ใช้ Google Drive API Read-only scope — ไม่มีการแก้ไขข้อมูลใดๆ
- Folder cache หมดอายุทุก 10 นาที หรือกดปุ่มถังขยะเพื่อล้างทันที
