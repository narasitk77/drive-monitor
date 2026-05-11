#!/bin/bash
# ============================================================
# CineFlow Launcher — ดับเบิลคลิกเพื่อเปิดแอป
# ============================================================

cd "$(dirname "$0")"

# Find Node.js
NODE=""
for candidate in \
  "/Users/narasitk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node" \
  "$(which node 2>/dev/null)"; do
  if [ -x "$candidate" ]; then NODE="$candidate"; break; fi
done

PORT=8899

# Kill any existing process on the port
if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "Stopping existing server on port $PORT..."
  kill $(lsof -ti:$PORT) 2>/dev/null
  sleep 1
fi

# Start server
if [ -n "$NODE" ]; then
  echo "Starting CineFlow server with Node.js..."
  "$NODE" serve.js > /tmp/cineflow.log 2>&1 &
elif command -v python3 > /dev/null; then
  echo "Starting CineFlow server with Python 3..."
  python3 -m http.server $PORT > /tmp/cineflow.log 2>&1 &
else
  osascript -e 'display dialog "ไม่พบ Node.js หรือ Python 3 ในเครื่อง\nกรุณาติดตั้ง Node.js ก่อน" buttons {"OK"} default button "OK"'
  exit 1
fi

# Wait for server to come up
sleep 2

# Open in default browser
open "http://localhost:$PORT"

osascript -e "display notification \"เปิดที่ http://localhost:$PORT\" with title \"CineFlow\" subtitle \"Server กำลังทำงาน\""

echo ""
echo "✅ CineFlow running at http://localhost:$PORT"
echo "หน้าต่างนี้สามารถปิดได้ — server จะทำงานต่อในเบื้องหลัง"
echo "เพื่อหยุด: kill \$(lsof -ti:$PORT)"
echo ""
read -p "กด Enter เพื่อปิด terminal นี้..."
