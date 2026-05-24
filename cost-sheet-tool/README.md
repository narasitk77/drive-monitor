# Cost Sheet Generator — Setup Guide

เครื่องมือช่วยสร้าง Cost Sheet แบบสำเร็จรูปสำหรับทีม Producer  
Rate อ้างอิงจากข้อมูลจริง 2025–2026 แยกตาม Tier A/B/C

---

## วิธีติดตั้ง (ทำครั้งเดียว ~5 นาที)

### 1. เปิด Google Sheet ที่ต้องการใช้เป็น "ฐาน"

สร้าง Google Sheet ใหม่ หรือใช้ Sheet เดิมก็ได้  
(script จะสร้าง tab ใหม่ทุกครั้งที่ generate — ไม่ทับข้อมูลเดิม)

### 2. เปิด Apps Script Editor

ไปที่ **Extensions → Apps Script**

### 3. สร้างไฟล์และวางโค้ด

ใน Apps Script Editor มี `Code.gs` อยู่แล้ว ให้ทำตามนี้:

**ไฟล์ที่ต้องสร้าง:**

| ชื่อไฟล์ | ประเภท | วิธีสร้าง |
|---|---|---|
| `Code.gs` | Script | มีอยู่แล้ว — ลบโค้ดเดิมออก แล้ววาง `Code.gs` จากโฟลเดอร์นี้ |
| `Data.gs` | Script | คลิก **+** → Script → ตั้งชื่อ `Data` → วางโค้ดจาก `Data.gs` |
| `Sidebar` | HTML | คลิก **+** → HTML → ตั้งชื่อ `Sidebar` → วางโค้ดจาก `Sidebar.html` |

> **สำคัญ:** ชื่อไฟล์ HTML ต้องเป็น `Sidebar` พอดี (ไม่มี .html ต่อท้ายใน Apps Script)

### 4. Save และ Reload Sheet

- กด **Ctrl+S** (หรือ Cmd+S) ใน Apps Script
- กลับไปที่ Google Sheet แล้ว **Reload หน้า**
- จะเห็นเมนู **📋 Cost Sheet** ปรากฏขึ้นใน menu bar

### 5. ใช้งาน

1. คลิก **📋 Cost Sheet → สร้าง Cost Sheet ใหม่**
2. Sidebar จะเปิดทางขวา
3. กรอกข้อมูล → กด **สร้าง Cost Sheet →**
4. ระบบสร้าง tab ใหม่ใน Sheet พร้อมใช้งานทันที

---

## โครงสร้างไฟล์

```
cost-sheet-tool/
├── Code.gs      — Logic หลัก: sidebar, sheet generation
├── Data.gs      — Rate data + dropdown lists
├── Sidebar.html — UI ฝั่ง browser
└── README.md    — ไฟล์นี้
```

---

## อัปเดต Rate Data

แก้ที่ **Data.gs** → `RATE_DATA`  
โครงสร้าง: `Tier → ชื่อตำแหน่ง → { median, p75, n }`

```javascript
A: {
  'Videographer (Outsource)': { median: 3000, p75: 6240, n: 21 },
  ...
}
```

- **median** = ใช้ตั้ง baseline
- **p75**    = ใช้เป็น buffer / ceiling
- **n**      = จำนวน data points อ้างอิง

---

## อัปเดต AE List

แก้ที่ **Data.gs** → `AE_LIST` array

---

*อ้างอิง rate: ยอดใบแจ้งหนี้จริง 2025 (Mar–Dec) + 2026 (Jan–Apr), Gross ก่อน WHT 3%*
