@echo off
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
echo [SYNC] المراقبة التلقائية: اي تعديل في الكود غادي يطلع للموقع اوطو.
echo [SYNC] خلي هاد النافذة محلولة ملي كتخدم.
echo.
node scripts/auto-push.js
pause
