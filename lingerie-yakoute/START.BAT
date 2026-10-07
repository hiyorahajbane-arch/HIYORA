@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
echo [START] LINGERIE YAKOUTE - Node version:
node --version
if not exist "server\node_modules" (
  echo [START] Installing server packages...
  call npm.cmd --prefix server install
)
if not exist "client\node_modules" (
  echo [START] Installing client packages...
  call npm.cmd --prefix client install
)
if not exist "server\data\db.json" (
  echo [START] Seeding demo products...
  node server\seed.js
)
if not exist "client\dist\index.html" (
  echo [START] Building client...
  call npm.cmd --prefix client run build
) else (
  powershell -NoProfile -Command "$s=Get-ChildItem -Path 'client\src' -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1; $d=Get-Item 'client\dist\index.html' -ErrorAction SilentlyContinue; if ($s.LastWriteTime -gt $d.LastWriteTime) { exit 1 } else { exit 0 }"
  if errorlevel 1 (
    echo [START] New changes detected, rebuilding client...
    call npm.cmd --prefix client run build
  ) else (
    echo [START] Client is up to date, skipping build.
  )
)
echo.
echo [START] Starting LINGERIE YAKOUTE store...
echo   Server: http://localhost:3002
echo   Admin:  http://localhost:3002/admin  (admin / admin123)
echo.
echo [START] Opening browser automatically in 4 seconds...
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3002"
call npm.cmd --prefix server start
if errorlevel 1 (
  echo [ERROR] Server failed to start - check messages above
  pause
  exit /b 1
)
